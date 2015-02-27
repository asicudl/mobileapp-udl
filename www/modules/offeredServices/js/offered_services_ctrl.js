angular.module('starter.offeredservices')

.controller('OfferedServicesCtrl',['$scope','$ionicModal','$timeout','OfferedServicesService','$stateParams', function($scope, $ionicModal, $timeout,OfferedServicesService,$stateParams) {
    
    $scope.title = "Offered Services"; 
    
    $scope.initList = function (){
         $scope.offeredServicesList  = OfferedServicesService.getAOfferedServices();
    };
    
    $scope.initOfferedService = function (){
        
        //In the case we access directly from event 
        if ($scope.offeredServicesList===undefined || $scope.offeredServicesList.lenght <= 0){
            $scope.initList();
        }
        
        //Look for the agenda Event
        for (var i = 0; i < $scope.offeredServicesList.length; i++){
            if ($scope.offeredServicesList[i].id ===  $stateParams.offeredServiceId){
                $scope.currentService = $scope.offeredServicesList [i];
                break;
            }
        }
    };
    
    
}]);

