<<<<<<< HEAD
# Happy Dev Website

Happy Dev is a network of independent developers. [happy-dev.fr](http://happy-dev.fr)

The website a proof-of-concept for a the use of distributed data through the LDP protocol.

The repository name is self-explainatory, the is the repository for the happy-dev organization website code.
The goal of this repository is to collaboratively work on interfacing the ldp-framework for manipulating Linked Data with the D3JS library for presenting the information as nodes and links between them.

The base code of the fluidgraph library by fluidlog (https://github.com/fluidlog/fluidgraph )will probably be used (at least tested).

So, getting back to work ;-)

## Installation

As usual, cloning from sources:

```
git clone https://github.com/happyDev-team/HappyWebSite
```

Then, because there is a dependency (to be probably removed later) to the fluidgraph project:

```
git submodule init
git submodule update
```

You should now have the whole project + a library directory containing the fluidgraph library files.
