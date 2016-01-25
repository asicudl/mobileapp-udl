angular.module('starter.agendaevents')  
    .controller('AgendaEventsCtrl',['$scope','$ionicPopup','$ionicListDelegate','$ionicLoading','$timeout','AgendaService','I18nService','$stateParams','_','$location','$filter','$timeout','$q','$rootScope','$cordovaSocialSharing',function($scope, $ionicPopup,$ionicListDelegate,$ionicLoading, $timeout,AgendaService,I18nService,$stateParams,_,$location,$filter,$timeout,$q,$rootScope,$cordovaSocialSharing) {

        var LOADING_TMPLT= '<i class="ion-loading-c"></i> ';
        $scope.fullEvents = false;
        $scope.agendaList = [];
        $scope.waitForRefreshDelay = false;
        var waitForDelayExecution;
        
        if (localStorage.newAgendaItems===undefined){
            localStorage.newAgendaItems=0;
        }
        
        var changeEvents = {};
        
        $scope.pullText = '';

        $scope.$on('$ionicView.enter', function() {
            //Load the new items
            
            //In case we got updated the array of items provided by the service is another one. We must update it
            if ($scope.eventsViewInitialized && $location.$$url === '/app/agendaevents' && !$scope.waitForRefreshDelay){
                $scope.refreshItems();
            }
        });
        
        $scope.$on('$ionicView.leave', function() {
            //Load the new items

            //In case we got updated the array of items provided by the service is another one. We must update it
            if ($scope.eventsViewInitialized && $location.$$url !== '/app/agendaevents'){
                $rootScope.newAgendaItems=0;
                localStorage.newAgendaItems=0;
            }
        });

        $scope.$on('$stateChangeStart', function() {
            $scope.$parent.extraButtons = null;
        })

        $scope.initList = function (){
            var initialized = $q.defer();
            $scope.initializeBundles().then (function () {
                $ionicLoading.show({template: LOADING_TMPLT +  $scope.rb.ctrl_agenda_initializing + "..."});
                
                $q.all ([AgendaService.getAgendaItems()]).then(function (results){

                    $scope.agendaList= results[0]; 
                    initialized.resolve();
                    $scope.eventsViewInitialized = true;

                    //In case we got updated the array of items provided by the service is another one. We must update it
                    if ($location.$$url === '/app/agendaevents' && !$scope.waitForRefreshDelay){
                        $scope.refreshItems();
                    }
                    
                }).catch (function (error){
                    //$scope.showAlert (rb.ctrl_while_stor, $scope.commonSolution);
                    initialized.reject (); //Not necessary to show an specific code
                }).finally (function (){
                    $ionicLoading.hide();  
                });
            });
            
            return initialized.promise;
        };


        $scope.initAgendaEvent = function (){
            
            $q.all([$scope.initializeBundles(), $scope.initList()]).then (function (){
                $scope.currentEvent = _.findWhere($scope.agendaList,{_id: $stateParams.agendaEventId});
            });

        };
        
        //Call the refresh manually
        $scope.askForRefreshItems = function (){
            if (waitForDelayExecution){
                $timeout.cancel(waitForDelayExecution);
            }
            $scope.waitForRefreshDelay = false;
            $scope.refreshItems();
        }

        $scope.refreshItems = function (){

            if ($rootScope.routeToServicesNotAvailable){

                $scope.$broadcast('scroll.refreshComplete'); 
            }else{
                AgendaService.retrieveNewItems().then(function (newAgendaList){
                    $scope.waitForRefreshDelay = true;
                    
                    $scope.agendaList = newAgendaList.agendaItems;
                    
                    $rootScope.newAgendaItems = parseInt(localStorage.newAgendaItems,10) + newAgendaList.numNewItems;
                    localStorage.newAgendaItems = $rootScope.newAgendaItems;
                    
                    //Don't allow to automatic refresh until 20 minutes 
                    waitForDelayExecution = $timeout (function (){
                        $scope.waitForRefreshDelay = false;   
                    },20 * 60 * 1000);
                    
                }).catch (function (error){
                    //The error code is the same so just needed one check
                    if (error !== AgendaService.errorCodes.ALREADY_RETRIEVING){
                        //$scope.showRefreshListError();
                        $rootScope.routeToServicesNotAvailable = true;
                    }
                }).finally(function (){
                    $scope.$broadcast('scroll.refreshComplete'); 
                });
            }
        }; 

        
        $scope.dateRangeFilter = function (property) {
            return function (item) {
                if (item[property] === null) return false;
                var itemDate = moment(item[property]);
                
                if (moment().startOf('day').isBefore(itemDate)){
                    return true;
                }
                return false;
            }
        };
        
        $scope.openExternalURL = function(url){
            window.open(url, '_system');
        };

        $scope.initializeBundles = function(){

            return $q.all ([I18nService.isReady(),I18nService.getResourceBundles('agendaEvents')]).then(function (data) {
                var resourceBundle =  data[1];
                $scope.rb = resourceBundle;

                //Initialize this 
                $scope.pullText = resourceBundle['ag_list_pull'];
            }); 
        };
        
        $scope.emptyAgenda = function (){
            return ($scope.agendaList === undefined || $scope.agendaList.length === 0);
        };

    }]).filter('hrefToJS', function ($sce, $sanitize) {
    return function (text) {
        var regex = /href="([\S]+)"/g;
        var newString = $sanitize(text).replace(regex, "onclick=\"angular.element(this).scope().openExternalURL('$1');return false\" href=");
        return $sce.trustAsHtml(newString);
    }
});