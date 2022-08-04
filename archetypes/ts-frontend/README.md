Archetype to generate file structure for any frontend typescript project

## How to use

```sh
# Install charmix
npm i -g charmix

# Add archetype
charmix add -t git https://github.com/vitonsky/charmix.git archetypes/ts-frontend

# Use
charmix use -d ./projectDirectory ts-frontend
```

## Options

- name: Project name
- useReact: Include react and its linters to dependencies
