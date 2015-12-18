angular.module('starter.pushnotification', [])
.factory('PushNotificationService', function (AuthService, $rootScope, $q, MessagesService,$location,$ionicHistory,$rootScope) {

    var pushConfig = {};
    
    //Load queries and errorCodes
    var pushService={
        ready: $q.defer()  
    };
    
    var  errorCodes = {
        
        // Push Service Registration
        'ERROR_REGISTERING_DEVICE': 10,
        'ERROR_UNASSOCIATING_DEVICE': 11,
        'ERROR_UNREGISTERING_DEVICE': 12,
        'ERROR_SETTING_UP_REGISTRATION': 13,
        'PUSH_FEATURE_NOT_PRESENT': 14,

        //Network accessing problems
        'USER_NOT_ALLOWED': 40
    };
    
    var registrationState = {
        'REGISTRATION_OK' : 10,
        'REGISTRATION_FAILED': 11,
        
        'UNASSOCIATION_OK': 20,
        'UNASSOCIATION_FAILED': 21,
        
        'UNREGISTRATION_OK': 30,
        'UNREGISTRATION_FAILED': 31
    };
    
    var setRegistrationState = function (status){
        window.localStorage.registrationStatus = status;
    }
    
    var onNotification = function(event) {
        
            //We always try and go to messages 
            MessagesService.retrieveNewMessages().
            then(function (numMessages){
                $rootScope.newMessages = parseInt(localStorage.newMessages,10) + numMessages;
                localStorage.newMessages = $rootScope.newMessages;
            }).finally (function (){
                $ionicHistory.nextViewOptions({
                    disableAnimate: true,
                    disableBack: true
                });
                
                $location.path('/app/messages');
            });
    };
    
    var factoryObject = {
        init: function (pushServiceDef){
            pushConfig = pushServiceDef.config;
            
        },
        isReady : function (){
            return pushService.ready.promise;   
        },
        
         registerDevice : function (){
            var registered  = $q.defer();
            
            var successRegisterHandler = function () {
                console.log ('Registration to PUSH service was success');
                setRegistrationState (registrationState.REGISTRATION_OK);
                registered.resolve(); 
            };

            var errorRegisterHandler = function (message) {
                console.log ('Error registering device to push service' + message);
                setRegistrationState (registrationState.REGISTRATION_FAILED);
                registered.reject(errorCodes.ERROR_REGISTERING_DEVICE);
            };
            
            
            AuthService.hasApiToken().then(function (profile){
                 //setup the push service
                try{
                    // Set the alias name to the pushConfig
                    var token = window.localStorage['authtoken'];
                    var username = window.localStorage['username'];
                    var device = window.localStorage['device'];

                    //We don't use the real username and password for authentication
                    pushConfig.ios.variantID = pushConfig.android.variantID =  username + ';;' + device;
                    pushConfig.ios.variantSecret = pushConfig.android.variantSecret = token;
                    pushConfig.alias = username;

                    // We delegate the registration to the cordova plugin ...
                    push.register(onNotification, successRegisterHandler, errorRegisterHandler, pushConfig);
                }catch (err) {
                    console.log ('Push service undefined or invalid, can\'t register: ' + err);
                    //Something went wrong
                    setRegistrationState (registrationState.REGISTRATION_FAILED);
                    registered.reject(errorCodes.ERROR_SETTING_UP_REGISTRATION);
                }
            }).catch (function (error){
                console.log ('Registrations was called but it was not authenticated: ' + error);
                setRegistrationState (registrationState.REGISTRATION_FAILED);
                registered.reject(errorCodes.USER_NOT_ALLOWED);
            });
            
            return registered.promise;
        },
       
        unassociateDevice : function (success,failure) {
            var unassociated = $q.defer();
         
            var successUnassociateHandler = function () {
                console.log ('Unassociation to PUSH service was success');
                setRegistrationState (registrationState.UNASSOCIATION_OK);
                unassociated.resolve(); 
            };

            var errorUnassociateHandler = function (message) {
                console.log ('Error unassociating device to push service' + message);
                setRegistrationState (registrationState.UNASSOCIACIATION_FAILED);
                unassociated.reject(errorCodes.ERROR_UNASSOCIATING_DEVICE);
            };

            //That way we announce to aerogear to unsubcribe from notigications
            AuthService.hasApiToken().then(function (profile){
                try{
                    pushConfig.alias = 'unregister';
                    push.register(onNotification, successUnassociateHandler, errorUnassociateHandler, pushConfig);
                }catch (err){
                    console.log ('Push service undefined or invalid, can\'t unassociate' + err);
                    setRegistrationState (registrationState.UNASSOCIACIATION_FAILED);
                    unassociated.reject(errorCodes.ERROR_SETTING_UP_REGISTRATION);
                }
            }).catch (function (error){
                    console.log ('Unassociation was called but it was not authenticated: ' + error);
                    setRegistrationState (registrationState.UNASSOCIACIATION_FAILED);
                    unassociated.reject(errorCodes.USER_NOT_ALLOWED);
            });  
            
            return unassociated.promise;
        },
        
        unregisterDevice : function (success,failure) {
            var unregistered = $q.defer();
            
            var successUnregisterHandler = function () {
                console.log ('Unregistration to PUSH service was success');
                setRegistrationState (registrationState.UNREGISTRATION_OK);
                unregistered.resolve(); 
            };

            var errorUnregisterHandler = function (message) {
                console.log ('Error Unregistering device to push service' + message);
                setRegistrationState (registrationState.UNREGISTRATION_FAILED);
                unregistered.reject(errorCodes.ERROR_UNASSOCIATING_DEVICE);
            };
             
            //That way we announce to aerogear to unsubcribe from notigications
            AuthService.hasApiToken().then(function (profile){
                try{
                    push.unregister (successUnregisterHandler,errorUnregisterHandler);
                }catch (err){
                    console.log ('Push service undefined or invalid, can\'t unregister: ' + err);
                    setRegistrationState (registrationState.UNREGISTRATION_FAILED);
                    unregistered.reject(errorCodes.ERROR_SETTING_UP_REGISTRATION);
                }
            }).catch (function (error){
                    console.log ('Unregister was called but it was not authenticated: ' + error);
                    setRegistrationState (registrationState.UNREGISTRATION_FAILED);
                    registered.reject(errorCodes.USER_NOT_ALLOWED);
            });
            
            return unregistered.promise;
        },
        
        //Get the current registration status
        getRegistrationStatus: function (){
            return window.localStorage.registrationStatus;
        }
     };
    return factoryObject;
});