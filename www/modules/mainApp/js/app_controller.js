
var appcontroller = angular.module('starter.appcontroller',['underscore']);

appcontroller.controller('AppCtrl', function($scope, $ionicModal, $ionicPlatform, $ionicPopup,$ionicHistory, $cordovaDevice, $ionicLoading, $timeout, AuthService,MessagesService,$location,$q,ngI18nResourceBundle) {
 $scope.loginData = {};

  $scope.authStatus = AuthService.authStatus;
  
  var loginModal = $q.defer();
    
  $scope.getLoginModal = function (){

      // Create the login modal that we will use later
      $ionicModal.fromTemplateUrl('modules/authentication/templates/login.html', {
        scope: $scope
      }).then(function(modal) {
          loginModal.resolve (modal);
      });  
      
      return loginModal.promise;
  };

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.getLoginModal().then (function (modal){
        modal.hide();
    });
  };

  // Open the login modal
  $scope.login = function() {
      $scope.getLoginModal().then (function (modal){
            modal.show();
      });
  };


    $scope.logout = function() {
       
        //Unassociate the device
        MessagesService.unassociateDevice().then (function (){
            $scope.showUnassocieatedOk();
       }).catch (function (error){
            //Actually we just can inform to user about it
            $scope.showUnassocieatedFail();
       }).finally (function (){
            AuthService.logout ();
            MessagesService.deleteAll().catch (function (error){
                $scope.showDeletingError();
            });
       });
        
    };
    
    $scope.showUnassocieatedOk = function (){
        $ionicPopup.alert ({
            title: $scope.rb.ctrl_account_disconnected_title,
            template: $scope.rb.ctrl_account_disconnected_ok
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
        template: $scope.rb.ctrl_loging_in
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
                    template: $scope.rb.ctrl_setting_account
                });

                delete $scope.loginError;
                $scope.closeLogin();

            
                //Lets call to registration to the PUSH service
                MessagesService.registerDevice().catch (function (error){
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
        delete window.sessionStorage.apiToken;
        $ionicLoading.hide();  
    }
  };

    
   ngI18nResourceBundle.getAll({locale: 'ca',name: 'mainApp/bundles/mainappBundle'}).then(function (resourceBundle) {
        $scope.rb = resourceBundle;
   }); 
    
  //When ready try to auth by token first 
  if ('/app/settings' !== $location.path()){ // Just initialize in case the controller is loaded from main app
    $ionicPlatform.ready(function() {
        
    //When all service are ready Launch the authentication process
      $q.all ([ AuthService.isReady(), MessagesService.isReady()]).then(function (){ 
          AuthService.authenticateByToken().then (function (){
              $ionicLoading.show({template: $scope.rb.ctrl_initializin});         
              MessagesService.registerDevice().catch (function (error){
                $scope.showErrorOnRegistration();
              }).finally (function (){
                  //Whatever happens with the registration we hide the loading panel
                  $ionicLoading.hide();  
              });
          }).catch (function (error){
              // If not auth didn't recognize token, so we must login again
              //On that case login first
              $ionicLoading.hide();
              if (error === AuthService.errorCodes.NO_VALID_TOKEN || error === AuthService.errorCodes.NO_TOKEN_DATA){
                   $scope.login ();
              }else{
                  $scope.showServiceUnavaliable ();
                  //TODO: Let's check automatically later ???
              }
          }); 
      });
    });
  } else{
    $ionicLoading.hide();   
  }
});

