Archetype to generate file structure for any typescript project

## How to use

```sh
# Install charmix
npm i -g charmix

# Add archetype
charmix add -t git https://github.com/vitonsky/charmix.git archetypes/typescript

# Use
charmix use -d ./projectDirectory typescript
```

## Options

- name: Project name
- useReact: Include react and its linters to dependencies
