results.tsv: bin/scrape
	bin/scrape 2>./results.tsv
bin/scrape: go.mod go.sum scripts/scrape/main.go
	go build -o bin/scrape scripts/scrape/main.go
