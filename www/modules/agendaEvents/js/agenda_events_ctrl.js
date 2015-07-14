angular.module('starter.agendaevents')  
    .controller('AgendaEventsCtrl',['$scope','$ionicPopup','$ionicListDelegate','$ionicLoading','$timeout','ActivityService','AgendaService','I18nService','$stateParams','_','$location','$filter','$timeout','$q','$rootScope',function($scope, $ionicPopup,$ionicListDelegate,$ionicLoading, $timeout,ActivityService,AgendaService,I18nService,$stateParams,_,$location,$filter,$timeout,$q,$rootScope) {
    
    $scope.title = "Activitats"; 
    $scope.fullEvents = false;
    $scope.eventsList = [];
    $scope.agendaList = [];
    var changeEvents = {};
        
    $scope.$on('$ionicView.enter', function() {
        //Load the new messages
        if ($scope.agendaInitialized && $location.$$url === '/app/agendaevents'){
            $scope.refreshItems();
        }
        
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
        var initialized = $q.defer();
        
        $scope.eventsList  = ActivityService.getEvents();
        
        AgendaService.getAgendaItems().then(function (agendaItems){
            $scope.agendaList= agendaItems;//Is the second promise return parameter
            initialized.resolve();
            $scope.agendaInitialized = true;
            
            //In case we got updated the array of items provided by the service is another one. We must update it
            $scope.refreshItems();
        }).catch (function (error){
            //$scope.showAlert (rb.ctrl_while_stor, $scope.commonSolution);
            initialize.reject (); //Not necessary to show an specific code
        }).finally (function (){
            $ionicLoading.hide();  
        });
        
        return initialized.promise;
    };
    
    $scope.initEvent = function (){
            $scope.initList().then (function (){
                    $scope.currentEvent = _.findWhere($scope.agendaList,{_id: $stateParams.agendaEventId});
            });
      
    };
        
    $scope.refreshItems = function (){

            if ($rootScope.routeToServicesNotAvailable){
                    $scope.$broadcast('scroll.refreshComplete'); 
            }else{
                AgendaService.retrieveNewItems().then (function (agendaItems){
                    $scope.agendaList = agendaItems;
                    
                }).catch (function (error){
                    if (error !== AgendaService.errorCodes.ALREADY_RETRIEVING){
                        //$scope.showRefreshListError();
                        $rootScope.routeToServicesNotAvailable = true;
                    }
                }).finally(function (){
                    $scope.$broadcast('scroll.refreshComplete'); 
                });
            }
        };    
        

}]);


