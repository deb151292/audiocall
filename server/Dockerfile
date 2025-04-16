# Stage 1: Build the Go binary
FROM golang:1.23.2 AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN GOOS=linux GOARCH=amd64 go build -o server

# Stage 2: Use Debian-based Go runtime image
FROM golang:1.23.2

WORKDIR /app
COPY --from=builder /app/server .
RUN chmod +x /app/server

EXPOSE 8080
CMD ["./server"]