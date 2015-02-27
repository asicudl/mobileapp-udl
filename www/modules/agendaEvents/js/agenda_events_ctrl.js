angular.module('starter.agendaevents')

.controller('AgendaEventsCtrl',['$scope','$ionicModal','$timeout','AgendaEventsService','$stateParams', function($scope, $ionicModal, $timeout,AgendaEventsService,$stateParams) {
    
    $scope.title = "Agenda Events"; 
    
    $scope.initList = function (){
         $scope.agendaEventsList  = AgendaEventsService.getAgendaEvents();
    };
    
    $scope.initEvent = function (){
        
        //In the case we access directly from event 
        if ($scope.agendaEventsList===undefined || $scope.agendaEventsList.lenght <= 0){
            $scope.initList();
        }
        
        //Look for the agenda Event
        for (var i = 0; i < $scope.agendaEventsList.length; i++){
            if ($scope.agendaEventsList[i].id ===  $stateParams.agendaEventId){
                $scope.currentEvent = $scope.agendaEventsList [i];
                break;
            }
        }
    };
    
}]);

