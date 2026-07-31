FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /calculator-api ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /calculator-api /calculator-api
EXPOSE 8080
ENTRYPOINT ["/calculator-api"]
