FROM golang:1.14.1-stretch as builder

COPY ./ /server
WORKDIR /server

RUN go get ./
RUN go build -o ./build/server

FROM ubuntu:19.10
COPY --from=builder /server/build/server /usr/bin/
COPY --from=builder /server/scripts/migrations/ /migrations

RUN apt-get update && apt-get install -y ca-certificates 

EXPOSE 80
CMD ["/usr/bin/server"]