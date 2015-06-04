
angular.module('starter.appcontroller',['underscore'])

.controller('AppCtrl', function($scope, $ionicModal, $ionicPlatform, $ionicPopup,$ionicHistory, $cordovaDevice, $ionicLoading, $timeout, AuthService,MessagesService,$location,$q) {
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
            title: 'Account disconnected', 
            template: 'Your device has been disconnected correctly. Please, login again if you want to access again to messages and receive notifications',
        });
    };
    
    $scope.showUnassocieatedFail = function (){
       $ionicPopup.alert ({
            title: 'Account disconnected', 
            template: 'Your device has been disconnected but services are not notified. It can be possible that you receive notifications for a while',
        });
    };

    $scope.showServiceUnavaliable = function (){
        $ionicPopup.alert ({
            title: 'Connection failed', 
            subTitle: 'Connection to service has failed',
            template: 'Connection has failed, maybe you don\'t have fully internet access or our services are down now. You can check all messages until you get connected again'
        });
    };
    
    $scope.showErrorOnRegistration = function (){
        $ionicPopup.alert ({
            title: 'Registering process failed', 
            subTitle: 'Connection to service has failed',
            template: 'We couldn\'t register your device in our system, it could make that some notifications alerts will not appear.'
        });
    };
        
    $scope.showDeletingError = function (){
        $ionicPopup.alert ({
            title: 'Error cleaning messages', 
            template: 'There was an error cleaning your stored messages. Please, clean data manually to ensure that messages are deleted.',
        });
    };    
    
  
    
    // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    $scope.closeLogin ();  

    $ionicLoading.show({
        template: 'Logining'
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
                    template: 'Setting account'
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
                $scope.loginError = 'Username and/or password were wrong, try it again please';       
                setTimeout ($scope.login,300);
            } else if (error ===  AuthService.errorCodes.ERROR_CREATING_TOKEN){
                $scope.loginError = 'Something went wrong while registering your device, please try to login again';
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

    
  //When ready try to auth by token first 
  if ('/app/settings' !== $location.path()){ // Just initialize in case the controller is loaded from main app
    $ionicPlatform.ready(function() {
      //When all service are ready Launch the authentication process
      $q.all ([ AuthService.isReady(), MessagesService.isReady()]).then(function (){ 
          AuthService.authenticateByToken().then (function (){
              $ionicLoading.show({template: 'Initializing... '});         
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