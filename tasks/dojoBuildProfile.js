/*
 * grunt-dojo-build-profile
 * https://github.com/kfbishop/grunt-dojo-build-profile
 *
 * Copyright (c) 2013 Karl Bishop
 */

'use strict';

module.exports = function (grunt) {

	var dbp   = require('dojoBuildProfile'),
 	    fs    = require('fs'),
 	    madge = require('madge');


 	grunt.registerTask('dojoBuildProfile', 'Auto generate Dojo build profile.', function(action) {

 		var options = this.options({

		    //-- scanExcludeList: List of RegExp patterns (modules or dirs) to exclude from scan
		    scanExcludeList: [],

		    //-- profileFile: Name of the resulting profile file to write out
		    //--	Default: "./profile.js"
		    profileFile : "./profile.js",

		    //-- appPackages: Package locations to be scanned. List of package objects
		    //--	[{name:"packageName", location:"./relative/to/current/dir"}, ...]
		    appPackages : [],

			//-- libPackages: Unscanned packages to be referenced as part of final build only.
		    //-- It is assumed that these packages will be loaded manually in the app.
		    libPackages : [],

		    //-- appLayers : List of layer objects
		    //-- 	[{
		    //--		name : "name of layer",
		    //--		includes: ["module", "or app package name", ...],
		    //--		excludes: ["module", "or app package name", ...]
		    //--	}, ... ]
		    appLayers : [],

		    //-- baseLayerDeps: Include commonly used modules into a base layer?
		    baseLayerDeps : true,

		    //-- baseLayerName: Layer name for common modules that deserve their own layer
		    baseLayerName : "appBase",

		    //-- baseLayerThreshold: Number of times a module is used in appLayers to be applied to baseLayer
		    baseLayerThreshold : 8
		}),

	    //-- Build up profile object
	    profile = {
	    	stripConsole : "normal",
		    copyTests : false,
		    cssOptimize : "comments",
		    packages : [
		    	{ name : "dojo" , location : "./dojo"  },
		    	{ name : "dijit", location : "./dijit" },
		    	{ name : "dojox", location : "./dojox" }
		    ],
		    layers : {
		    	"dojo/dojo" : {
		    		include: [
		    			"dojo/_base/lang",
		    			"dojo/_base/declare",
		    			"dojo/selector/acme",
		    		],
		    		customBase: true
		    	}
	    	}
	    },

	    libRegExpList = ["dojo","dijit","dojox"],
	    dojoIncludeList = [],
	    libRegExp = null,
	    scanDirs = [],
	    results,
	    modCounts   = {},
	    baseModList = [],
	    libModList  = [],
	    appModList  = [];

	    //-- Check actions
	    grunt.log.writeln('Running: ' + this.name + (action?":"+action.cyan:"") );
	    try {
   		    init();
   		    switch action {
   	    	case "scan":
   		    	scan();
   		    	showSanResults();
   		    	break;
   	    	default:
   		    	scan();
   	    		processProfile();
   		    }
	    } catch(err) {
	      	grunt.log.error( err );
	      	return false;
	    }
	    grunt.log.ok();
	    return true;


	    //---------------------------------------------------------------------
	    var init = function() {
	    	//-- Build our libs regexp
	    	options.libPackages.forEach(function(pkg) {
	    	  	libRegExpList.push( pkg.name );
	    	});
	    	libRegExp = new RegExp( "^(" + libRegExpList.join("|") + ")\/.*$" );

	    	//-- Get locations of appPackages to scan
	    	options.appPackages.forEach(function(pkg) {
	    	  	scanDirs.push(pkg.location);
	    	});
	    	grunt.log.writeln('Scanning app packages...');

	    	//-- Add fixed defaults to the scanExcludeList
	    	options.scanExcludeList.push("package");
	    	options.scanExcludeList.push("docs");
	    	options.scanExcludeList.push("build");
		    options.scanExcludeList.push("tests");
	    };

	    //---------------------------------------------------------------------
	    var scan = function() {
	    	//-- run madge on the given app package dirs
	    	results = madge( scanDirs, {
	    	  	format       : 'amd',
	    	  	exclude      : "(" + options.scanExcludeList.join("|").replace(/\//g,"\\/") + ")",
	    	  	breakOnError : false
	    	});

	    	for( var mod in results.tree ) {
	    	    //grunt.log.writeln('processing: ' + mod );
	    	    add(mod);

	    	    results.tree[mod].forEach( function(m) {
	    	    	if ( m.indexOf("!") >= 1 ) {
	    		        //grunt.log.writeln('stripping macro suffix -> ' + m );
	    	    	    m = m.substring(0, m.indexOf("!"));
	    	    	}
	    	    	if ( m.indexOf(".") === 0) {
	    	        	//-- Tack on base of current mod
	    	        	//grunt.log.writeln('qualifying relative path -> ' + m );
	    	        	m = mod.substring(0, mod.lastIndexOf("/") ) + m.substring(m.indexOf("/"));
	    	    	}
	    		    add(m);
	    		});
	    	}

  		    //-- Check for base layer thresholds.
   		    if ( options.baseLayerDeps ) {
   	    	  	for ( var mod in modCounts ) {
   	      			if ( modCounts[mod] >= options.baseLayerThreshold ) {
   	      				baseModList.push( mod );
   		      		}
   		      	}
   	    	}

	    };

	    //---------------------------------------------------------------------
	    var showSanResults = function() {
		    //grunt.log.writeln('\nmod count map:\n' + JSON.stringify(modCounts) );
		    grunt.log.writeln('\nApp Modules:\n'  + JSON.stringify(appModList.sort(),null,2)  );
	    	grunt.log.writeln('\nLib Modules:\n'  + JSON.stringify(libModList.sort(),null,2)  );

	    	if ( options.baseLayerDeps ) {
		    	grunt.log.writeln('\nBase Modules:\n' + JSON.stringify(baseModList.sort()) );
		    }
	    };

	    //---------------------------------------------------------------------
		var add = function(mod) {
		  	if (typeof modCounts[mod] === 'undefined' && profile.layers["dojo/dojo"].include.indexOf(mod) < 0) {
		    	//grunt.log.writeln('adding -> ' + mod );
		    	modCounts[mod] = 0;
		      	if ( libRegExp.test( mod ) ) {
		      		libModList.push(mod);
		      	} else {
		      		appModList.push(mod);
		      	}
			}
			modCounts[mod]++;
		};

	    //---------------------------------------------------------------------
		var processProfile = function() {

			//-- Add in other packages
			profile.packages = profile.packages.concat( options.libPackages, options.appPackages );
			//-- Add appLayer files

			grunt.log.write("\nSaving: " + options.profileFile + " ...");
			try {
			  	fs.writeFileSync( options.profileFile, JSON.stringify(profile,null,2));
			} catch(err) {
			  	grunt.log.error( err );
			  	return false;
			}
			grunt.log.ok();
			return true;
		};
	});

};
