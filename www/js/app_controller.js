
angular.module('starter.appcontroller',['underscore'])

.controller('AppCtrl', function($scope, $ionicModal, $ionicPlatform, $ionicPopup, $cordovaDevice, $ionicLoading, $timeout, AuthService,MessagesService,$location,$q) {
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
       AuthService.logout ();
       AuthService.authStatus.hasToken=false;
       
       MessagesService.unassociateDevice();
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
                $scope.loginError = 'Username and/or password are wrong, try it again please';       
                $scope.login ();
            } else if (error ===  AuthService.errorCodes.ERROR_CREATING_TOKEN){
                $scope.loginError = 'Something went wrong while registering your device, please try to login again';
                $scope.login ();
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
              }
          }); 
      });
  });
});