# What's benefits?

When you create archetype for charmix, instead of boilerplate from scratch, you have benefits such:

- simply to create
- easy maintenance and declarative structure
- ability to extends exists archetypes to base your template on it
- whole powerful of charmix platform
- community help

# How to start

First of all, read the [ArchetypeAPI docs](./docs/ArchetypeAPI.md).

You may use [archetype template](../archetypes/archetype-template/) to quick start:

```sh
# Install template
charmix add -t git https://github.com/vitonsky/charmix.git archetypes/archetype-template

# Create project directory
charmix use -d ./myArchetype archetype name=myArchetypeName
```

# Publish

This is not required step, you may use your archetype private, with no publish, but if you would share it, you may save time to other people.

To make your archetype available for people, you have to:

- Publish your archetype to any git hosting or npm registry with keyword `charmixArchetype`
- [Create issue](https://github.com/vitonsky/charmix/issues/new) with url to your archetype to add it to [archetypes list](./Archetypes.md)
