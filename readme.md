# Tribalizm: real life MUD RPG

## Admin

To run admin panel, run docker image:

```sh
docker run --env-file=<env_file> -it --network tribalizm admin:1.0
```

## Development

NOTE: you have to read all environment variables, eg. with `set-env ./.env.develop` where `set-env`
is bash alias:

```bash
set-env(){
    file="${1:-.env}"
    export $(egrep -v '^#' "${file}" | xargs)
}
```
