Charmix it's a tool to generate projects from custom templates (archetypes).

It's try to solve a problem when you copy files from one project to another over and over. And then, you sync changes in every single file between projects.

Now you can make project template once and apply it for every new project.

# Why Charmix?

**If you tried to use boilerplate generators** like `create-react-app` and similar, you may ask yourself "why i should use charmix instead"?

Answer is - for your productivity. Instead of use few CLI tools and remember how to use its and read the docs for each, you may use one tool that have one powerful interface for ALL archetypes.

**If you created a boilerplate generators**, you may ask yourself "why i should to create charmix archetype, instead of standalone boilerplate?"

Answer is - easy maintenance and whole powerful of platform. All you need is create JSON file on 4 lines contains glob pattern to files for static archetype or javascript function that receive options and return configured files as buffers or strings for dynamic archetypes.

Read more in [ArchetypeAPI docs](./docs/ArchetypeAPI.md)

# How to use?

## Installation

```sh
# install it globally
npm install -g charmix

# or yarn
yarn global add charmix
```

## Add your favorite archetypes

Charmix is only platform to manage boilerplates, but it's not contains any archetypes by default. It's like [APT](<https://en.wikipedia.org/wiki/APT_(software)>) for linux packages.

Thus, you have to find archetypes on the internet or create yours and add it to charmix registry to use.

You can look at [archetypes list][archetypeslist] or try to find on [github](https://github.com/topics/charmixarchetype) or [npm](https://www.npmjs.com/search?q=%23charmixarchetype) by keyword `charmixArchetype`.

```sh
# Add archetype from git service
charmix add -t git https://github.com/vitonsky/charmix.git archetypes/typescript

# Or from local machine
charmix add -t local /home/username/archetypeDirectory
```

## Use archetype

```sh
# You may list available archetypes
charmix list

# Let's use archetype typescript
charmix add -t local /home/username/archetypeDirectory

# To write files to current directory
charmix use typescript
# To write files to directory projectDir
charmix use -d ./projectDir typescript

# Specify parameters manually
charmix use -d ./projectDir typescript name=projectName useReact=true
# Or specify parameters in interactive mode
charmix use -d ./projectDir -i typescript
```

Explore commands by run any command with argument `--help` or `-h`.

Try it `charmix -h`, `charmix use -h`.

# How to create a new archetype?

If you want to create archetype, read the [ArchetypeAPI docs](./docs/ArchetypeAPI.md) and [suggests to create archetype](./docs/CreateArchetype.md).

If you create archetype and want to make it public, publish your archetype to any git hosting or npm registry with keyword `charmixArchetype` and [create issue](https://github.com/vitonsky/charmix/issues/new) with url to your archetype to add it to [archetypes list][archetypeslist].

---

Inspired by [Maven](https://maven.apache.org/archetype/index.html)

[archetypeslist]: ./docs/Archetypes.md
