angular.module('starter.i18n', ['ngI18n'])
.factory('I18nService', function (AppConfigService, $q, ngI18nResourceBundle, ngI18nConfig) {
    
    var i18n = {
        ready: $q.defer(),
        defaultLocale: '',
        currentLocale: '',
        supportedLocales: []
    };
    
     //Extra functionalities to out i18n module
     var compose = function() {
            if (arguments.length>0) {
                var txt = this[arguments[0]];
                if (txt) {
                    for (var z=0; z<arguments.length; z+=1) {
                        txt = txt.replace('{'+z+'}',arguments[z+1]);
                    }
                    return txt;
                } else {
                    return 'not found: '+arguments[0];
                }
            }
            return null;
      };
    
    
    var factoryObject = {
        init: function (i18nConfig){
            i18n.defaultLocale = i18nConfig.defaultLocale;
            i18n.supportedLocales = i18nConfig.supportedLocales;
            i18n.ready.resolve ();
            i18n.currentLocale = window.localStorage.currentLocale || i18n.defaultLocale;
        },
        
        isReady: function (){
            return i18n.ready.promise;
        },
        
        getResourceBundles:function (moduleFolderName){
            //We need to change moduleFolderName for something more elegant
            
            var deferred = $q.defer();

            this.isReady().then (function (){
                var options = {locale: factoryObject.getCurrentLocale(), name: moduleFolderName +'/bundles/resourceBundle'};

                ngI18nResourceBundle.get(options).success(function (resourceBundle) {
                    // Add the functionality to build composed strings
                    resourceBundle.compose = compose;
                    deferred.resolve (resourceBundle);
                });  
            });

            return deferred.promise; 
        },
        
        getCurrentLocale: function (){
            return i18n.currentLocale;
        },
        
        setCurrentLocale: function(locale){
            window.localStorage.currentLocale = i18n.currentLocale = locale;
        },
        
        hasLocalePreference: function (){
            return window.localStorage.currentLocale ? true : false; 
        },
        
        getSupportedLocales: function (){
            return i18n.supportedLocales;   
        },
        
        getDefaultLocale: function (){
            return i18n.defaultLocale;   
        }
        
        
    }
    
    return factoryObject;
    
}).value('ngI18nConfig', {
    //defaultLocale should be in lowercase and is required!!
    defaultLocale: 'en',
    //supportedLocales is required - all locales should be in lowercase!!
    supportedLocales:['ca', 'en'],
    //without leading and trailing slashes, default is i18n
    basePath:'modules',
    //default is false
    cache: false,
});