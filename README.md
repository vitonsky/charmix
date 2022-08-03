Charmix is a tool to generate project files structure from archetypes (file structure template created by users).

It's try to solve of the problem when you copy files from the one project to another over and over.

Now you can make archetype from this files once and apply this template and configure variables (like project name or framework linters set) any times by one command.

Like that `charmix use ts-frontend name=projectX useReact=true`.

# Why Charmix?

Instead of use few CLI tools to generate project templates (like `create-react-app`) and remember how it to use, you may use one simple and powerful tool.

Instead of create your own CLI tool to generate project template, you may implement ONE javascript function which receive options and return configured files. Delegate another work like CLI interface implementation, resolving paths, distribution, etc to charmix.

# How to use?

- install it globally `npm i -g charmix`
- add any archetype you want like that:
  `charmix add -t git https://github.com/vitonsky/charmix.git archetypes/ts-frontend`
- generate project structure by execute command in project directory
  `charmix use ts-frontend`

You may create your own archetype, add it to charmix and use. You may place your archetype on local machine, git repository or npm/npm-like registry.

To use archetype, you have install it firstly, to do it you have to use command `add` and specify reference to archetype and type of reference

```
# install archetype from git repository (local repositories supports too)
charmix add -t git https://example.com/archetypeRepositoryName

# install archetype from local machine
charmix add -t local /home/username/archetypeDirectory

# or the same, but set name manually, instead of name from archetype manifest
charmix add -n anotherArchetypeName -t local /home/username/archetypeDirectory
```

And then use command `use` to apply archetype to directory

```
charmix use archetypeName

# or the same, but to different directory
charmix use -d ./subDirectory/foo anotherArchetypeName

# you may specify parameters to configure archetype
charmix use archetypeName parameter1=value1 foo=42 projectName='some name with spaces'
```

Also you may use commands to list archetypes, delete and update.

Explore commands by run any command with argument `--help` or `-h`, for example `charmix -h`, `charmix use -h`.

# Archetypes

Visit the [archetypes list page][archetypeslist], to find template for your purpose.

If you can't found archetype that you need, create it yourself (and publish to the world if you wish).

# How to create a new archetype?

If you want to create archetype, read [the docs](./docs/ArchetypeAPI.md) about it.

If you create archetype and want to make it public, publish your archetype to any git hosting or npm registry and [create issue](https://github.com/vitonsky/charmix/issues/new) with link to your archetype to add it to [archetypes list][archetypeslist].

You may use archetype template to quick start:

- Install template `charmix add -t git https://github.com/vitonsky/charmix.git archetypes/archetype-template`
- Create archetype hook template `charmix use archetype name=myArchetypeName`

---

Inspired by [Maven](https://maven.apache.org/archetype/index.html)

<!-- TODO: add links -->

[archetypeslist]: ./docs/Archetypes.md
