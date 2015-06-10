angular.module('starter.auth')

    .controller('LoginCtrl', function($scope, AuthService, I18nService){
    $scope.loginData = {};
    var LOADING_TMPLT= '<i class="ion-loading-c"></i> '

    // Triggered in the login modal to close it
    $scope.closeLogin = function() {
        $scope.$close(true);
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function() {
        $scope.closeLogin ();  

        $ionicLoading.show({
            template: LOADING_TMPLT + $scope.rb.ctrl_loging_in
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

    I18nService.getResourceBundles('authentication').then(function (resourceBundles){
        $scope.rb = resourceBundles;
    });

});