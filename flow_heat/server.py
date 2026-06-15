from http.server import SimpleHTTPRequestHandler, HTTPServer

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    try:
        server = HTTPServer(('localhost', 8000), CORSRequestHandler)
        print('Server started at http://localhost:8000')
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
        print('Server stopped.')
