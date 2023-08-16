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

// the url of a JSON document containing the Table of Contents (ToC) for the AWS Service Authorization Reference
const tocUrl = base + "/toc-contents.json"
const servicePrefixPattern = "(service prefix:"

const (
	actionsColIndex = iota
	descriptionsColIndex
	accessLevelColIndex
	resourceTypesColIndex
	conditionKeysColIndex
	dependentActionsColIndex
)

type TocEntry struct {
	Title    string     `json:"title"`
	Href     string     `json:"href"`
	Contents []TocEntry `json:"contents,omitempty"`
}

type TableEntry struct {
	// the human-readable name of the service, e.g. "AWS Account Management"
	Service string
	// the service prefix, e.g. "account" is the service prefix for "AWS Account Management"
	Prefix string
	// The action identifier. Always PascalCase/UpperCamelCase.
	Action string
	// A link to action-specific documentation
	ActionDocUrl string
	// a URL with a fragment identifier pointing to the scraped row.
	TableCellUrl string
	// A brief description of the action
	Description,
	// The access level required for the action (e.g. "Read", "Write", "List")
	AccessLevel string
	ResourceTypes, ConditionKeys, DependentActions []string
}

// fetch the Table of Contents (ToC) and extract all the documentation urls to scrape
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
			continue // this is a fragment identifier; skip the rest of the loop
		}
		if strings.HasPrefix(entry.Href, "http") {
			result[i] = entry.Href
		} else if strings.HasPrefix(entry.Href, "/") {
			panic(entry.Href) // this seems not to happen, but if it does, we'll know
		} else {
			result[i] = base + "/" + entry.Href
		}
	}
	return result, nil
}

// find the service name (e.g. "AWS Account Management") and prefix (e.g. "account") in the current selection
func getServiceIdentifiers(dom *goquery.Selection) (serviceName string, servicePrefix string) {
	p := dom.Find("p").
		Has("code").
		FilterFunction(func(i int, s *goquery.Selection) bool {
			return strings.Contains(s.Text(), servicePrefixPattern)
		}).First()
	serviceName = strings.TrimSpace(strings.SplitN(p.Text(), servicePrefixPattern, 2)[0])
	// strip the leading "AWS " or "Amazon" from the service name for nicer alphabetical sorting
	serviceName = strings.TrimSpace(strings.TrimPrefix(strings.TrimPrefix(serviceName, "AWS "), "Amazon "))
	servicePrefix = p.Contents().Filter("code").Text()
	return
}

func main() {
	debugMode := false
	collector := colly.NewCollector(
		colly.CacheDir(cacheDir),
		colly.Async(true),
		colly.AllowedDomains("docs.aws.amazon.com"),
	)
	if debugMode {
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
		service, prefix := getServiceIdentifiers(div.DOM)
		table := div.DOM.Find("table").First()
		if table.Length() == 0 {
			log.Panicf("no table found in %s", div.Request.URL)
		}
		ths := table.Find("thead>tr>th")
		if ths.Length() != 6 {
			// We're expecting exactly the indexes in the consts at the top of this file
			// 0 = actionsColIndex
			// 1 = descriptionsColIndex
			// 2 = accessLevelColIndex
			// 3 = resourceTypesColIndex
			// 4 = conditionKeysColIndex
			// 5 = dependentActionsColIndex
			log.Panicf("%d cols in table @ %s", ths.Length(), div.Request.URL)
		}
		tableBaseUrl := div.Request.URL.String()
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
			// figure out if which column a cell belongs to
			i := 0
			cells.Each(func(_ int, td *goquery.Selection) {
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
				span, err := strconv.ParseInt(td.AttrOr("rowspan", "1"), 10, 0)
				if err != nil {
					panic(err)
				}
				rowSpans[i] += int(span)
				var text string
				var ps *goquery.Selection
				var links *goquery.Selection
				if i < resourceTypesColIndex {
					text = strings.ReplaceAll(strings.TrimSpace(td.Text()), "\n", " ")
				} else {
					ps = td.Children().Filter("p")
					links = ps.Has("a[href]")
				}
				switch i {
				case actionsColIndex:
					result.Action = text
					result.ActionDocUrl = td.Children().Filter("a[href]").First().AttrOr("href", "")
					{
						id := td.Children().Filter("a[id]").First().AttrOr("id", "")
						if id != "" {
							result.TableCellUrl = tableBaseUrl + "#" + id
						}
					}
				// ======
				// omitted to make absolutely sure this scraping falls under fair use:
				// ======
				// case descriptionsColIndex:
				// 	result.Description = text
				case accessLevelColIndex:
					result.AccessLevel = text
				case resourceTypesColIndex:
					result.ResourceTypes = append(result.ResourceTypes, links.Map(func(i int, s *goquery.Selection) string {
						return strings.TrimSpace(s.Text())
					})...)
				case conditionKeysColIndex:
					result.ConditionKeys = append(result.ConditionKeys, links.Map(func(i int, s *goquery.Selection) string {
						return strings.TrimSpace(s.Text())
					})...)
				case dependentActionsColIndex:
					// these are in `prefix:Action` format **without** links
					result.DependentActions = append(result.DependentActions, ps.Map(func(_ int, s *goquery.Selection) string {
						return strings.TrimSpace(s.Text())
					})...)
				}
			})
		})
		data <- results
	})
	output := csv.NewWriter(os.Stderr)
	output.Comma = '\t'

	go func() { // collect, sort, serialize the scraped data
		defer wg.Done()
		err := output.Write([]string{
			"service",
			"prefix",
			"action",
			"access_level",
			"table_link",
			"action_docs_link",
			"condition_keys",
			"dependent_actions",
			// "description", // omitted to make absolutely sure this scraping falls under fair use
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
		// sort the results by (human-readable) Service, then Action
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
				r.AccessLevel,
				r.TableCellUrl,
				r.ActionDocUrl,
				strings.Join(r.ConditionKeys, ", "),
				strings.Join(r.DependentActions, ", "),
				// r.Description, // omitted to make absolutely sure this scraping falls under fair use
			}
		}
		err = output.WriteAll(tsv)
		if err != nil {
			log.Panic(err)
		}
		output.Flush()
	}()
	for _, url := range urls {
		if err = collector.Visit(url); err != nil {
			log.Panic(err)
		}
	}
	collector.Wait()
	close(data)
	wg.Wait()
}
