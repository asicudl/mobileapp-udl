// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic','ngCordova','ngI18n' ,'starter.appcontroller','starter.config','starter.db','starter.auth','starter.agendaevents','starter.offeredservices','starter.messages','angular.filter','angularMoment'])

.run(function($ionicPlatform,$ionicLoading, AppConfigService,DBService, AuthService, MessagesService,$q,ngI18nResourceBundle) {
    
    $ionicPlatform.ready(function() {

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)

        AppConfigService.getConfig('dev').then (function (result){
            $ionicLoading.show({
                    template: 'Loading... '
            });
            
            //Configure each service with the configuration
            DBService.init (result.dbService);
            AuthService.init (result.authenticationService);
            MessagesService.init (result.pushService);
        });
        
            
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
        
     //Add some extra functionalities to out i18n module
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

      //Wrap this exrta functionality inside the ng18n service     
      ngI18nResourceBundle.getAll = function (options){
            var deferred = $q.defer();

            this.get(options).success(function (resourceBundle) {
                // Add the functionality to build composed strings
                resourceBundle.compose = compose;
                deferred.resolve (resourceBundle);
            });  

            return deferred.promise; 
      };    
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "modules/mainApp/templates/menu.html",
    controller: 'AppCtrl'
  })
  
  .state('app.settings', {
      url: "/settings",
      views: {
        'menuContent': {
          templateUrl: "modules/mainApp/templates/settings.html",
          controller: 'AppCtrl'
        }
      }
    })

  .state('app.agendaevents', {
    url: "/agendaevents",
    views: {
      'menuContent': {
        templateUrl: "modules/agendaEvents/templates/agendaEventsList.html",
        controller: "AgendaEventsCtrl"
      }
    }
  })
  
   .state('app.agendaevent', {
    url: "/agendaevents/:agendaEventId",
    views: {
      'menuContent': {
        templateUrl: "modules/agendaEvents/templates/agendaEventsView.html",
        controller: "AgendaEventsCtrl"
      }
    }
  })
  
  .state('app.messages', {
    url: "/messages",
    views: {
      'menuContent': {
        templateUrl: "modules/messages/templates/messagesList.html",
        controller: 'MessagesCtrl'
      }
    }
  })
  
  .state('app.message', {
    url: "/messages/:messageId",
    views: {
      'menuContent': {
        templateUrl: "modules/messages/templates/messagesView.html",
        controller: 'MessagesCtrl'
      }
    }
  })
    
  .state('app.offeredservices', {
      url: "/offeredservices",
      views: {
        'menuContent': {
          templateUrl: "modules/offeredServices/templates/offeredServicesList.html",
          controller: 'OfferedServicesCtrl'
        }
      }
    })

  .state('app.offeredservice', {
    url: "/offeredservices/:offeredServiceId",
    views: {
      'menuContent': {
        templateUrl: "modules/offeredServices/templates/offeredServicesView.html",
        controller: 'OfferedServicesCtrl'
      }
    }
  })
  
  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/agendaevents');
    
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


