.PHONY: all lint local-db

all: data/iam_actions.sql

lint:
	docker run --rm -v $(pwd):/app -w /app golangci/golangci-lint:v1.51.2 golangci-lint run -v

data/schema.sql data/iam_actions.sql: \
	data/iam_actions.sqlite3            \
	scripts/update_db_dump.sh           \

	scripts/update_db_dump.sh

data/iam_actions.sqlite3:  \
	data/iam_actions.tsv     \
	scripts/normalize.sql    \
	scripts/load_data.sh     \

	scripts/load_data.sh

data/iam_actions.tsv: bin/scrape
	bin/scrape 2>$@

bin/scrape: go.mod go.sum cmd/scrape/main.go
	go build -o bin/scrape cmd/scrape/main.go

local-db:
	wrangler --config ${PWD}/website/wrangler.toml \
		d1 execute --local DB                        \
		--file=${PWD}/data/iam_actions.sql

db-deploy: data/iam_actions.sql
	wrangler --config ./website/wrangler.toml \
		d1 execute DB                           \
		--file=./data/iam_actions.sql           \
		--batch-size 1000000000


site-deploy:
	@echo "TODO"
