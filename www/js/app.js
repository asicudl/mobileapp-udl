// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers','starter.agendaevents'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
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
        templateUrl: "templates/agendaEvents/agendaEventsList.html",
        controller: "AgendaEventsCtrl"
      }
    }
  })
  
   .state('app.agendaevent', {
    url: "/agendaevents/:agendaEventId",
    views: {
      'menuContent': {
        templateUrl: "templates/agendaEvents/agendaEventsView.html",
        controller: "AgendaEventsCtrl"
      }
    }
  })

  /*.state('app.messages', {
    url: "/messages",
    views: {
      'menuContent': {
        templateUrl: "templates/messages.html",
        controller: 'MessagesCtrl'
      }
    }
  })
  
  .state('app.message', {
    url: "/messages/:messageId",
    views: {
      'menuContent': {
        templateUrl: "templates/message.html",
        controller: 'MessagesCtrl'
      }
    }
  })
    
  .state('app.offeredServices', {
      url: "/offeredServices",
      views: {
        'menuContent': {
          templateUrl: "templates/offeredServices.html",
          controller: 'OfferedServicesCtrl'
        }
      }
    })

  .state('app.offeredService', {
    url: "/offeredService/:offeredServiceId",
    views: {
      'menuContent': {
        templateUrl: "templates/offeredServic.html",
        controller: 'OfferedServicesCtrl'
      }
    }
  });*/
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/agendaevents');
});


