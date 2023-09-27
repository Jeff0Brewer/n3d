# Installation
- unzip dataset (`public/data.zip`)
- `npm install` to install dependencies
- build:
    - `npm run dev` to start a development server
    - or `npm run build` to generate a `dist` directory, containing the bundled distribution build
- to host distribution build locally, the `dist` directory must be served with an http server
    - a workable command line http server can be found [here](https://www.npmjs.com/package/http-server)
    - to host locally, simply run `http-server dist`
