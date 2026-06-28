# Third-Party Notices

This product includes software developed by third parties. The full license
texts are reproduced below.

---

## CloudMeet

The interview-scheduling module's calendar-provider clients (Google/Microsoft
raw-`fetch` integrations) and the availability algorithm were adapted from
CloudMeet. QDX.one re-implements them as a tenant-scoped module with its own
schema, a pure tested availability engine, and a transactional outbox; the
original code is the basis for the provider request/response shapes and the
slot-generation approach.

- Project: CloudMeet — https://github.com/dennisklappe/CloudMeet
- Author: Dennis Klappe
- License: MIT

```
MIT License

Copyright (c) Dennis Klappe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
