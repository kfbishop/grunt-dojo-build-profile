# grunt-dojo-build-profile

NOTE: PRE-RELEASE. NOT YET FUNCTIONAL!

> Automatic Dojo build profile based on provided source code

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-dojo-build-profile --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-dojo-build-profile');
```

## Available tasks

- default: Runs a scan and writes out the target profile file.
- scan: Runs a scan and displays the collected results only.

### default task

The default task scans the application source and generates a Dojo build profile file.


### scan task

In your project's Gruntfile, add a section named `dojoBuildProfile` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({

  dojoBuildProfile: {
	options: {
	  scanExcludeList: ['app/path/someModule','docs'],
	  profileFile : "./profile.js",
	  appPackages : [{name:"app", location:"./src/app"}, ... ],
	  libPackages : [{name:"majix", location:"./libs/majix"}, ... ],
	  appLayers : [
	    {
	      name    : "app",
	      includes: ["app", ... ],
	      excludes: ["majix", ... ]
	    },
	    ...
  	  ],
	  baseLayerDeps : true,
	  baseLayerName : "libBase",
  	  baseLayerThreshold : 8
	}
  }
})
```

### Options

#### scanExcludeList
Type: `Array` of Strings
Default value: `[]` (Empty list)

List of modules or directories to exclude from scanning. The following values are automatically added to the list:
- package, docs, tests, build

Example: `scanExcludeList: ['app/path/someModule','mydocs']`

#### profileFile
Type: `String`
Default value: `"./profile.js"`

Name of the resulting profile file to write out

Example: `profileFile: "./profile.js"`

#### appPackages
Type: `Array` of package objects
Default value: None [**REQUIRED**]

Package locations to be scanned. The 'package object' consists of:
- **name**: name of the package
- **location**: relative location of the source tree

Example:
```js
  appPackages : [
    {name:"app", location:"./bower_components/dcordova"  },
    {name:"myextras", location:"./bower_components/myextras"}
  ]
```

#### libPackages
Type: `Array` of package objects
Default value: `[]` (Empty list)

Un-scanned packages to be referenced as part of final build only. Used when generating the profile and exclusion patterns. It is assumed that these packages will be loaded manually in the app.

The following libraries are automatically added to this list:
- dojo
- dijit
- dojox

Example:
```js
  libPackages : [
  	{ name:"majix", location:"./libs/majix"}
  ]
```

#### appLayers
Type: `Array` of layer objects
Default value: `[]` (Empty list)

Example:
```js
  appLayers	[
  	{
		name : "nameOfLayer",
		includes: ["module", "or app package name", ...],
		excludes: ["module", "or app package name", ...]
	},
	...
  ]
```

#### baseLayerDeps
Type: `boolean`
Default value: `true`

Include commonly used modules into a base layer?

If `true` (default) a custom base layer is generated that includes all appPackages that are referenced more than `mbaseLayerThreshold` times throughout the app. This baseLayer should be loaded as part of the app startup using the normal `require` syntax.

If `false` then no baseLayer is generated, but this could result in duplicate modules being generated if multiple appLayers are defined.

Example: `baseLayerDeps : true`


#### baseLayerName
Type: `String`
Default value: `"appBase"`

Layer name for common modules that deserve their own layer.
This is only utilized if `baseLayerDeps:true`.

Example: `baseLayerName : "appBase"`

#### baseLayerThreshold
Type: `Number`
Default value: `8`

Number of times a module is used in appLayers to be applied to baseLayer.
This is only utilized if `baseLayerDeps:true`.

Example: `baseLayerThreshold : 5`

