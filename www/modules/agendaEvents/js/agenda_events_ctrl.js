angular.module('starter.agendaevents')  
    .controller('AgendaEventsCtrl',['$scope','$ionicModal','$interval','AgendaEventsService','$location','$stateParams', function($scope, $ionicModal, $interval,AgendaEventsService,$location,$stateParams) {
    
    $scope.title = "Activitats"; 
    $scope.fullEvents = false;
    $scope.firstIndex = -1;
    $scope.secIndex = 0;
    $scope.events  = [];
    $scope.eventsList = [];
    $scope.agendaList = [];
    var changeEvents = {};
    
    $scope.$on('$ionicView.enter', function() {
        //Load the new messages
        if ($location.$$url === '/app/agendaevents'){
            var expandButton = { 'text' : 'Totes', 'onclick' : function () {
                    if ($scope.fullEvents){
                        this.text = 'Totes';
                    }else{
                        this.text = 'Recull';
                    }

                    $scope.fullEvents= !$scope.fullEvents;    

                }
            };
                                
            $scope.$parent.extraButtons = [expandButton];
        }
    });
    
    $scope.$on('$stateChangeStart', function() {
        $scope.$parent.extraButtons = null;
    })
    
    $scope.initList = function (){
        $scope.eventsList  = AgendaEventsService.getEvents();
        $scope.agendaList = AgendaEventsService.getAgendaItems();
        
        if ($scope.events.length > 1){
            $scope.secIndex = 1;
        }
        
    };
    
    $scope.initEvent = function (){
        
        //In the case we access directly from event 
        if ($scope.agendaList===undefined || $scope.agendaList.length <= 0){
            $scope.initList();
        }
        
        //Look for the agenda Event
        for (var i = 0; i < $scope.agendaList.length; i++){
            if ($scope.agendaList[i].id ===  $stateParams.agendaEventId){
                $scope.currentEvent = $scope.agendaList [i];
                break;
            }
        }
    };

}]);


