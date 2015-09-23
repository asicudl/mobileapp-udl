// Starter App

angular.module('starter', ['ionic','ngCordova', 'starter.appcontroller','starter.config','starter.i18n','starter.db','starter.auth','starter.agendaevents','starter.offeredservices','starter.messages','starter.pushnotification','angular.filter','angularMoment'])

    .run(function($ionicPlatform, $ionicLoading, AppConfigService, DBService, AuthService, MessagesService, AgendaService, ActivityService,OfferedServicesService, PushNotificationService, I18nService) {
    
    $ionicPlatform.ready(function() {

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)

        AppConfigService.getConfig('dev').then (function (result){
            
            //Configure each service with the configuration
            I18nService.init (result.i18n);
            DBService.init (result.dbService);
            AuthService.init (result.authenticationService);
            MessagesService.init (result.messagesService);
            AgendaService.init (result.agendaService);
            ActivityService.init (result.activityService);
            OfferedServicesService.init (result.offeredServicesService);
            PushNotificationService.init (result.pushService);
        });
        
            
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
  
      .state('app.activityevent', {
      url: "/activityevents/:activityEventId",
      views: {
          'menuContent': {
              templateUrl: "modules/agendaEvents/templates/activityEventsView.html",
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


