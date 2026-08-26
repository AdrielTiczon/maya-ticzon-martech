# Send Money Limits Module

## Overview
This is a minimalist backend REST API that covers the send money feature.

## Quickstart
To start, you can clone this repository via:
```bash
  # ssh (recommended) or;
  git clone git@github.com:AdrielTiczon/maya-ticzon-martech.git

  # https
  git clone https://github.com/AdrielTiczon/maya-ticzon-martech.git
```

Next, please ensure you have setup the `.env`

For demo purposes, you can copy `.env.example` and then proceed. You can change the variables later on.


In order to run this application successfully, please ensure you have installed **[Docker](https://www.docker.com/)**. This application also uses [docker-compose](https://docs.docker.com/compose/) to handle multiple containers.

Run the following command:
```bash
  docker compose up # or docker compose up -d
```

Next, verify if the docker services are running via:

### Option 1: (via terminal)

Run the command:
```bash
  docker ps
```
### Option 2: Docker desktop

You should find a container and when unfolded you should be able to see the following:

```
  - maya-ticzon-martech
    | -> db (image: postgres18)
    | -> api-gateway (image: maya-ticzon-martech-app)
```

Please check and ensure that all containers/services are running before proceeding.

## SwaggerUI
This follows the OpenAPI Specification (OAS) describing the endpoints in the application. Currently it is hosted to the `/docs` routes.

If you are using the values from `.env.example` then you can simply visit:

http://localhost:3001/docs

otherwise, can visit it on whichever port you decide to hosted your api on. (eg: http://localhost:8000/docs)


## Application flow
In order to not bloat the main readme, you can visit or open the [application flow](./docs/flow.md) document.

You will find comprehensive flows and examples of how the application runs.


## Assumptions and failure cases
#todo

## Production deployment checks







