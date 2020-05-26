# Freeckly / Backend

## Installation

### Clone the project

```bash
$ git clone https://github.com/freeckly/freeckly-back
```

### Install packages

```bash
$ yarn install
```

### Set Environment variables

```bash
MONGODB_URI=
FRONTEND_HOST=
PORT=
CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=
STRIPE_KEY=
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
TWILIO_AUCCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_NUMBER_FROM=
MAILGUN_MAIL_TO=
TWILIO_NUMBER_TO=
```

## Build & Run

### Build to Import fixtures

It will create 2 admin and 3 users, 10 products and 3 productDetails per product

```bash
$ yarn run build
```

### Run project in Developpment mode

```bash
$ yarn run dev
```

### Run project in Production mode

```bash
$ yarn run start
```
