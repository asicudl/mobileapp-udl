
angular.module('starter.appcontroller',['underscore'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, AuthService,$cordovaDevice,$ionicLoading) {
 $scope.loginData = {};

  $scope.init = function (){
    //We set the authentication options here
    $scope.isAuth = AuthService.isTokenAuth();
  }
    
    
  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('modules/authentication/templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.loginModal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.loginModal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.loginModal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    $scope.closeLogin ();  

    $ionicLoading.show({
        template: 'Authentication'
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
        
        AuthService.authenticateByCredentials(username,password).then(function (data){
                //if authentication successfull create a new token for the device
                $ionicLoading.show({
                    template: 'Setting account'
                });
                
                //Store the apitoken to perform API calls
                window.sessionStorage.apiToken = data.token;
            
                AuthService.requestNewToken(username,device).then (function (data){
                        window.localStorage.authtoken = data.token;
                        window.localStorage.username = username;
                        window.localStorage.device = device;
                        delete $scope.loginError;
                        $scope.closeLogin();
                    }).catch (function (data){
                        $scope.loginError = 'Can\'t create a login token';
                        $scope.login ();
                    });

        }).catch (function (data){
            $scope.loginError = 'Username or password are wrong, try it again';
            delete window.sessionStorage.apiToken;
            $scope.login ();
        }).finally (function (data){
            $ionicLoading.hide();
        });
    
    }else{
        console.log ('Can\'t access to device ID');
        delete window.sessionStorage.apiToken;
        $ionicLoading.hide();  
    }

  };
        
        
});