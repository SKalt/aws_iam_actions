package main

import (
	"encoding/csv"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"

	"github.com/PuerkitoBio/goquery"
	colly "github.com/gocolly/colly/v2"
	debug "github.com/gocolly/colly/v2/debug"
)

const cacheDir = "./.cache/colly"
const base = "https://docs.aws.amazon.com/service-authorization/latest/reference"
const tocUrl = base + "/toc-contents.json"
const pattern = "(service prefix:"

type TocEntry struct {
	Title    string     `json:"title"`
	Href     string     `json:"href"`
	Contents []TocEntry `json:"contents,omitempty"`
}

type TableEntry struct {
	Service, Prefix, Action, ActionDocUrl, Description, AccessLevel string
	ResourceTypes, ConditionKeys, DependentActions                  []string
}

func getUrlsToScrape() ([]string, error) {
	r, err := http.Get(tocUrl)
	if err != nil {
		return nil, err
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}

	toc := TocEntry{}
	err = json.Unmarshal(body, &toc)
	if err != nil {
		panic(err)
	}

	contents := toc.Contents[0].Contents[0].Contents
	result := make([]string, len(contents))
	for i, entry := range contents {
		if strings.HasPrefix(entry.Href, "#") {
			continue // skip the rest of the loop
		}
		if strings.HasPrefix(entry.Href, "http") {
			result[i] = entry.Href
		} else if strings.HasPrefix(entry.Href, "/") {
			panic(entry.Href)
		} else {
			result[i] = base + "/" + entry.Href
		}
	}
	return result, nil
}

func main() {
	dbg := false
	collector := colly.NewCollector(
		colly.CacheDir(cacheDir),
		colly.Async(true),
		colly.AllowedDomains("docs.aws.amazon.com"),
	)
	if dbg {
		collector.SetDebugger(&debug.LogDebugger{})
	}
	urls, err := getUrlsToScrape()
	if err != nil {
		panic(err)
	}
	data := make(chan []TableEntry)
	wg := sync.WaitGroup{}
	wg.Add(1)
	collector.OnHTML("#main-content", func(div *colly.HTMLElement) {
		p := div.DOM.Find("p").
			Has("code").
			FilterFunction(func(i int, s *goquery.Selection) bool {
				return strings.Contains(s.Text(), pattern)
			}).First()
		service := strings.SplitN(p.Text(), pattern, 2)[0]
		prefix := p.Contents().Filter("code").Text()
		table := div.DOM.Find("table").First()
		if table.Length() == 0 {
			log.Panicf("no table found in %s", div.Request.URL)
		}
		ths := table.Find("thead>tr>th")
		if ths.Length() != 6 {
			log.Panicf("%d cols in table @ %s", ths.Length(), div.Request.URL)
		}
		rows := table.Find("tbody>tr")
		if rows.Length() == 0 {
			panic("no rows")
		}
		rowSpans := make([]int, ths.Length())
		results := []TableEntry{}
		rows.Each(func(_ int, tr *goquery.Selection) {
			new := true
			for _, rowSpan := range rowSpans {
				if rowSpan > 1 {
					new = false
					break
				}
			}
			if new {
				for j := range rowSpans {
					rowSpans[j] = 0
				}
				results = append(results, TableEntry{
					Prefix:  prefix,
					Service: service,
				})
			}
			result := &results[len(results)-1]
			cells := tr.Children().Filter("td")
			i := 0
			cells.Each(func(_ int, s *goquery.Selection) {
				for {
					if i >= len(rowSpans) { // increment the row
						i = 0
						for j := range rowSpans {
							rowSpans[j]--
						}
					}
					if x := rowSpans[i]; x > 0 {
						i++
					} else {
						break
					}
				}
				span, err := strconv.ParseInt(s.AttrOr("rowspan", "1"), 10, 0)
				if err != nil {
					panic(err)
				}
				rowSpans[i] += int(span)
				var text string
				var xs *goquery.Selection
				if i < 3 {
					text = strings.ReplaceAll(strings.Trim(s.Text(), "\t\n\r "), "\n", " ")
				} else {
					xs = s.Children().Filter("p").Has("a[href]")
				}
				switch i {
				case 0:
					result.Action = text
					result.ActionDocUrl = s.Children().Filter("a[href]").First().AttrOr("href", "")
					// fmt.Println(rowSpans, result.Action)
				case 1:
					result.Description = text
					// fmt.Println(rowSpans, result.Action, result.Description)
				case 2:
					result.AccessLevel = text
					// fmt.Println(rowSpans, result.Action, result.AccessLevel)
				case 3:
					if xs.Length() > 0 {
						result.ResourceTypes = append(result.ResourceTypes, xs.Map(func(i int, s *goquery.Selection) string {
							return strings.Trim(s.Text(), "\t\n\r ")
						})...)
					}
				case 4:
					if xs.Length() > 0 {
						result.ConditionKeys = append(result.ConditionKeys, xs.Map(func(i int, s *goquery.Selection) string {
							return strings.Trim(s.Text(), "\t\n\r ")
						})...)
					}
				case 5:
					if xs.Length() > 0 {
						result.DependentActions = append(result.DependentActions, xs.Map(func(i int, s *goquery.Selection) string {
							return strings.Trim(s.Text(), "\t\n\r ")
						})...)
					}
				}
			})
		})
		data <- results
	})
	output := csv.NewWriter(os.Stderr)
	output.Comma = '\t'
	// TODO: sort by service, action for determinism
	go func() {
		defer wg.Done()
		err := output.Write([]string{
			"service",
			"prefix",
			"action",
			"action docs",
			"access level",
			"condition keys",
			"dependent actions",
			"description",
		})
		if err != nil {
			log.Panic(err)
		}
		output.Flush()
		allResults := []TableEntry{}
		for {
			resultSet, ok := <-data
			if ok {
				allResults = append(allResults, resultSet...)
			} else {
				break
			}
		}
		sort.SliceStable(allResults, func(i, j int) bool {
			x := &allResults[i]
			y := &allResults[j]
			return x.Service < y.Service || (x.Service == y.Service && x.Action < y.Action)
		})
		tsv := make([][]string, len(allResults))
		for i, r := range allResults {
			tsv[i] = []string{
				r.Service,
				r.Prefix,
				r.Action,
				r.ActionDocUrl,
				r.AccessLevel,
				strings.Join(r.ConditionKeys, ", "),
				strings.Join(r.DependentActions, ", "),
				r.Description,
			}
		}
		err = output.WriteAll(tsv)
		if err != nil {
			log.Panic(err)
		}
		output.Flush()
	}()
	for _, url := range urls {
		collector.Visit(url)
	}
	collector.Wait()
	close(data)
	wg.Wait()
}
