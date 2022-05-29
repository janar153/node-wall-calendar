![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

# Room info board

Simple Node app to show room free/busy information.

## Install & using

### Step 1

Clone this project

### Step 2

```sh
$ cd path-to-your-project-location
$ cp .env.exmaple .env
```

Edit .env file and add correct room e-mail and password to access room calendar events

### step 3

```sh
$ npm install
$ npm start
```

### Step 4

- open browser http://localhost:3002

## Example

### Example when room is free

![Room is free](/free.png)

### Example when room will be busy in next 15 minutes

![Room is busy](/warning.png)

### Example when room is busy

![Room is busy](/busy.png)

### Example booking now

![Book room](/book.png)
