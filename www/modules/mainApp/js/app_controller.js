angular.module('starter.appcontroller',['underscore'])

    .controller('AppCtrl', function($scope, $ionicModal, $ionicPlatform, $ionicPopup,$ionicHistory, $cordovaDevice, $ionicLoading, $timeout, AuthService, AppConfigService, MessagesService, ActivityService,PushNotificationService, I18nService, $location, $q,_, $window, $rootScope,$ionicSideMenuDelegate){ 
    $scope.loginData = {};
    $scope.localeData = {};
    $rootScope.newMessages = 0;
    $rootScope.newAgendaItems = 0;
    $rootScope.newActivityItems = 0;
    
    if (localStorage.newMessages===undefined){
        localStorage.newMessages=0;
    }
    
    if (localStorage.newAgendaItems===undefined){
        localStorage.newAgendaItems=0;
    }
    
    if (localStorage.newActivityItems===undefined){
        localStorage.newActivityItems=0;
    }
    
    $scope.authStatus = AuthService.authStatus;
    var loginModal = $q.defer();
    var localeModal = $q.defer();    
    var LOADING_TMPLT= '<i class="ion-loading-c"></i> ';

    $scope.getLoginModal = function (){

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('modules/authentication/templates/login.html', {
            scope: $scope
        }).then(function(modal) {
            loginModal.resolve (modal);
        });  

        return loginModal.promise;
    };

    $scope.getLocaleModal = function () {

        // Create the login modal that we will use later
        $ionicModal.fromTemplateUrl('modules/mainApp/templates/locale.html', {
            scope: $scope
        }).then(function(modal) {
            localeModal.resolve (modal);
        });  

        return localeModal.promise;
    };

    // Triggered in the login modal to close it
    $scope.closeLogin = function() {
        $scope.getLoginModal().then (function (modal) {
            modal.hide();
        });
    };

    // Open the login modal
    $scope.login = function() {
        $scope.getLoginModal().then (function (modal){
            modal.show();
        });
    };

    // Triggered in the locale modal to close it
    $scope.closeChooseLocale = function() {
        
        
        $scope.getLocaleModal().then (function (modal){
            modal.hide();
            I18nService.setCurrentLocale ($scope.localeData.locale);
            delete $scope.firstLocale;
            $window.location.reload(true);
        });
    };

    // Open the locale modal
    $scope.chooseLocale = function() {
        $scope.getLocaleModal().then (function (modal){

            I18nService.getResourceBundles('mainApp').then(function (resourceBundles){
                $scope.rb = resourceBundles;
                $scope.localeData.locale = $scope.currentLocale;
                modal.show();
            });      
        });

    };

    $scope.loadLocale = function (){

        I18nService.setCurrentLocale ($scope.localeData.locale);
        I18nService.getResourceBundles('mainApp').then(function (resourceBundles){
            $scope.rb = resourceBundles;
        });  
    };

    $scope.getLangMessage= function (){
        var foundLocale = _.find (I18nService.getSupportedLocales(),{"code": I18nService.getCurrentLocale()});
        if (foundLocale && $scope.rb){
            var locName = foundLocale ? foundLocale.name : "Desconegut";
            return $scope.rb.compose('settings_selected_language',locName);
        }
    };


    $scope.resetMessagesCounter = function (){
        $scope.safeApply (function (){$rootScope.newMessages = 0;});
    };
    
    $scope.resetActivityItemsCounter = function (){
        $scope.safeApply (function (){$rootScope.newActivityItems = 0;});
    }
    
    $scope.resetAgendaItemsCounter = function (){
            $scope.safeApply (function (){$rootScope.newAgendaItems = 0;});
    }
    
    $scope.logout = function() {

        //Unassociate the device
        /*PushNotificationService.unassociateDevice().then (function (){
            //No necessary to show anything
            //$scope.showUnassocieatedOk();
        }).catch (function (error){
            //Actually we just can inform to user about it
            $scope.showUnassocieatedFail();
        }).finally (function (){
            AuthService.logout ();
            MessagesService.deleteAll().catch (function (error){
                $scope.showDeletingError();
            });
        });*/
        
        PushNotificationService.unassociateDevice().then (function (){
            //No necessary to show anything
            //$scope.showUnassocieatedOk();
        }).catch (function (error){
            //Actually we just can inform to user about it
            $scope.showUnassocieatedFail();
        });
        
        AuthService.logout ();
        
        MessagesService.deleteAll().catch (function (error){
            $scope.showDeletingError();
        });

    };

    $scope.showUnassocieatedOk = function (){
        $ionicPopup.alert ({
            title: $scope.getResourceBundles().ctrl_account_disconnected_title,
            template: $scope.getResourceBundles().ctrl_account_disconnected_ok
        });
    };

    $scope.showUnassocieatedFail = function (){
        $ionicPopup.alert ({
            title: $scope.rb.ctrl_account_disconnected_title, 
            template: $scope.rb.ctrl_account_disconnected_failed
        });
    };

    $scope.showServiceUnavaliable = function (){
        $ionicPopup.alert ({
            title: $scope.rb.ctrl_unavailable_service_title, 
            template: $scope.rb.ctrl_unavailable_service_desc
        });
    };

    $scope.showErrorOnRegistration = function (){
        $ionicPopup.alert ({
            title: $scope.rb.ctrl_registration_failed_title,
            template: $scope.rb.ctrl_registration_failed_desc
        });
    };

    $scope.showDeletingError = function (){
        $ionicPopup.alert ({
            title: $scope.rb.ctrl_error_cleaning_title,   
            template: $scope.rb.ctrl_error_cleaning_desc 
        });
    };    


    // Perform the login action when the user submits the login form
    $scope.doLogin = function() {
        $scope.closeLogin ();  

        $ionicLoading.show({
            template: LOADING_TMPLT + $scope.rb.ctrl_login_in
        });

        var username = $scope.loginData.username;
        var password = $scope.loginData.password;

        var device;
        try{
            device = $cordovaDevice.getUUID();
        }catch (exception){
            device = '12345';   
        }

        if (device && username && password){

            AuthService.authenticateByCredentials(username,password).then(function (){

                $ionicLoading.show({
                    template: LOADING_TMPLT+  $scope.rb.ctrl_setting_account
                });

                delete $scope.loginError;
                $scope.closeLogin();

                //Lets call to registration to the PUSH service
                PushNotificationService.registerDevice().catch (function (error){
                    $scope.showErrorOnRegistration();
                }).finally (function (){
                    $ionicLoading.hide();
                });

            }).catch (function (error){
                if (error === AuthService.errorCodes.NO_VALID_CREDENTIALS){
                    $scope.loginError = $scope.rb.ctrl_invalid_credentials;       
                    setTimeout ($scope.login,300);
                } else if (error ===  AuthService.errorCodes.ERROR_CREATING_TOKEN){
                    $scope.loginError = $scope.rb.ctrl_error_validatig;
                    setTimeout ($scope.login,300);
                } else{ // On that case it seems that service is unavailable, lets alert it to avoid confusion
                    $scope.showServiceUnavaliable ();
                }

            }).finally (function (data){
                $ionicLoading.hide();
            });

        }else{
            console.log ('Can\'t access to device ID');
            AuthService.authStatus.hasToken = false;
            delete $window.sessionStorage.apiToken;
            $ionicLoading.hide();  
        }
    };

    $scope.doChooseLocale = function (){
        //Locale is already choosed 
        $scope.closeChooseLocale();
        authenticate();
    };

    //Inject a new function to the root $scope to be used acros the scopes

    $rootScope.authenticate = function (){

        var defered = $q.defer();
        //Just invalidate previous token
        AuthService.invalidateApiToken();
        AuthService.authenticateByToken().then (function (){

            $rootScope.appInitialized = true;
            $ionicLoading.show({template: LOADING_TMPLT +  $scope.rb.ctrl_initializing_app + "..."});         

            delete $rootScope.routeToServicesNotAvailable;

            PushNotificationService.registerDevice().catch (function (error){
                $scope.showErrorOnRegistration();
            });
            
            //First load of messages
            MessagesService.retrieveNewMessages().then (function (numMessages){
                $scope.safeApply(function (){
                    $rootScope.newMessages = parseInt(localStorage.newMessages,10)   + numMessages;
                    localStorage.newMessages = $rootScope.newMessages;
                });
            }).catch (function (error){
                if (error !== MessagesService.errorCodes.ALREADY_RETRIEVING){
                    $rootScope.routeToServicesNotAvailable = true;
                }
            });
   
            
            //Load the new Activities
            ActivityService.retrieveNewItems().then(function (newActivities){
                $scope.safeApply(function (){
                    $rootScope.newActivityItems = parseInt(localStorage.newActivityItems,10) + newActivities.numNewItems;
                    localStorage.newActivityItems = $rootScope.newActivityItems;
                });

            }).catch (function (error){
                //The error code is the same so just needed one check
                if (error !== ActivityService.errorCodes.ALREADY_RETRIEVING){
                    //$scope.showRefreshListError();
                    $rootScope.routeToServicesNotAvailable = true;
                }
            });
            
            
            //It's not necessary to do it for agenda because it's the first one we call
            
            /*AgendaService.retrieveNewItems().then(function (numNewAgenda){
                $rootScope.newAgendaItems = parseInt(localStorage.newAgendaItems,10) + numNewAgenda;
                localStorage.newAgendaItems = $rootScope.newAgendaItems;

            }).catch (function (error){
                //The error code is the same so just needed one check
                if (error !== AgendaService.errorCodes.ALREADY_RETRIEVING){
                    //$scope.showRefreshListError();
                    $rootScope.routeToServicesNotAvailable = true;
                }
            });*/
            
            
            //Whatever happens with the registration we hide the loading panel
            $ionicLoading.hide();  
            
            defered.resolve();

        }).catch (function (error){
            // If not auth didn't recognize token, so we must login again
            //On that case login first
            $ionicLoading.hide();

            if (error === AuthService.errorCodes.NO_VALID_TOKEN || error === AuthService.errorCodes.NO_TOKEN_DATA){
                AuthService.invalidateApiToken();  
                $scope.login ();
                defered.resolve();
            }else{
                //If you are initiating the app and failed for internet access to service then show alert
                if (!$rootScope.appInitialized) {
                    $scope.showServiceUnavaliable ();
                }                      

                $rootScope.routeToServicesNotAvailable = true;
                defered.reject();
                
                //Schedule another try for 5 minutes
                setTimeout (function (){
                    if ( $rootScope.routeToServicesNotAvailable){ //Still unavaiable
                           $rootScope.authenticate();
                    }
                }, 300*1000);
            }

            $rootScope.appInitialized = true;
        });  

        return defered.promise;
    };


    $scope.initSettings =function (){
        $ionicLoading.hide();   
    };
    
    $scope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $ionicPlatform.ready(function() {
        //When all service are ready Launch the authentication process
        $q.all ([ AuthService.isReady(), MessagesService.isReady(), I18nService.isReady()]).then(function (){

            //Load locale configuration
            $scope.supportedLocales = I18nService.getSupportedLocales();    
            $scope.currentLocale  = I18nService.getCurrentLocale();

            if (!I18nService.hasLocalePreference()){
                $scope.firstLocale = true;
                $scope.chooseLocale();       
            }else{

                I18nService.getResourceBundles('mainApp').then(function (resourceBundles){
                    $scope.rb = resourceBundles;

                    //Better do it when resource Bundles are received in order to show write error message if needed
                    if (!$scope.appInitialized){
                        $rootScope.authenticate();
                    }
                });
            }
        });
    });
});

