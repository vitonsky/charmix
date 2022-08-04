Archetype for [charmix](https://www.npmjs.com/package/charmix) to generate archetype template.

## How to use

```sh
# Install charmix
npm i -g charmix

# Add archetype
charmix add -t git https://github.com/vitonsky/charmix.git archetypes/archetype

# Use
charmix use -d ./projectDirectory archetype
```

## Options

- name: Archetype name
- options: Archetype options. Separate with comma, like that "foo,bar,baz"
