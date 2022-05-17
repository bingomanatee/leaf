# Forest: the state database

Forest uses graph-node state management to create and manage state and notification. Branches are stored independently
in indexed maps, and values and configurations are stored in node objects lined via branches. 

This classic pattern allows an open-ended design pattern with tunable value validation; you can use generation patterns
to create sub-nodes, allowing for easy testing and code reuse. 

Forest was designed initially for React but is suitable for any JS application; it doesn't depend on any [version of] React
and has a very small footprint of project interdependencies. 

## Advantages of Forest

### Synchronous Changes 

Unlike Redux, all changes are immediate; errors are thrown or values are changed in real time, allowing you to immediately
inspect the consequences of your actions in linear fashion

## Highly Testable State

The graph based nature of state (and the synchronous changes) make it easy to develop tests for Forest based applications. 

## Flexible validation

### Form validation
By default, all values in a node are locked in by **form** -- 
that is you cannot change an array into an object, but you can use strings and numbers interchangeably. 
This is in part because branch values are injected into node values if the value
is a compound form (Map, Array, Object) but not for non-compound (scalar) forms; keys that are appropriate for Maps, 
for instance, are not appropriate for Arrays or in some cases, Objects. 

### Type Validation

You can opt to use more strict Type based validation - 
in which case you can *not* replace a number with a string or vice versa.
Also, you can define your own functional test that must pass (return falsy) for updates to be accepted. 

In all cases, type errors throw, and if not caught may bring down an entire transaction. 

You can disable default (all) validations by asserting the configuration 'form' -> 'any', in which case no type checking
will occur and all values are acceptable, putting the onus of keeping your state types properly maintained on yourself. 

### Manual validation

You can for instance define selector branches to indicate the validity of a branch, which will flag bad values 
but will allow them to be written to state; good for forms in which you may want to allow the user to type a value,
but alert them to the status of their value with on-screen prompts. 

## Amazingly complete logging

Every change of state is kept in a historical array, which lets you diagnose change and consequences. 

Branch creation, value changes, node creation and configuration changes each trigger a loggable event allowing for 
fine-grained trail of action that defines your current state. 

## Reusable patterns

As a graph based system, you can reuse design patterns across your application; if you have a field management system
you like, you can turn it into a function and implement it across your application. By contrast it is very difficult to
reuse patterns in a hook / redux based system, due to the nature of their architectures.

## The inner workings of forest

I have iterated on state management for years; but this represents a pivot to a database driven approach to state representation.
A lot of the features I want in state are already part of the database design standard: schema, transactions, open graphs. 

Rather than create a set of complex referentially joined objects to accomplish this, I decided to try a database approach,
using index reference rather than object joins. Object references are problematic, and make erasing objects in memory 
problematic. In Forest, there is only one place that objects are stored by reference-the Forest. Objects are stored in 
"by type" maps (nodes, branches) and in the history branch. 

### Time to play B sides

Every object is created in a unique "time" slot - time is an ever-increasing posint, and objects are stored by that index
in the history map. If rollbacks are necessary, a range of objects are cancelled, and all caches recreate their computations
without them. 

Object caches are busted everytime that the "time" changes -- rather than doing complex calculations and only busting
caches when the known dependencies change, its assumed that any cached value *might* change if something changes, and
they are recreated and saved until the next time-based change. 

## Emitter based management

Changes trigger updates of content, and notifications emit to trigger validation routines. This is enabled with emitix,
an optimized rebuild of the Node.js EventEmitter class. 

