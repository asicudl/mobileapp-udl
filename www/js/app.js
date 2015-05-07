// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic','ngCordova',  ,'starter.appcontroller','starter.config','starter.db','starter.auth','starter.agendaevents','starter.offeredservices','starter.messages','angular.filter','angularMoment'])

.run(function($ionicPlatform,$ionicLoading, AppConfigService,DBService, AuthService, MessagesService) {
    
    $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    /* $ionicLoading.show({
        template: 'loading'
    });*/

        AppConfigService.getConfig('dev').then (function (result){
            //Configure each service with the configuration
            DBService.init (result.dbService);
            AuthService.init (result.authenticationService);
            
            MessagesService.init (result.pushService);
            
            //Register the device services
            MessagesService.registerDevice(onRegistrationSuccess, onRegistrationFailure);
                  

        });
        
    var onRegistrationSuccess = function () {
            console.log ("Device registerd");
            $ionicLoading.hide();
    }
    
    var onRegistrationFailure = function (error) {
            //show the error on screen 
            console.log ("Device failure registering");
            $ionicLoading.hide();
    }
            
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
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
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/agendaevents');
});


