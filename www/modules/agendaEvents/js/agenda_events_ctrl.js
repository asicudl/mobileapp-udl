angular.module('starter.agendaevents')  
    .controller('AgendaEventsCtrl',['$scope','$ionicPopup','$ionicListDelegate','$ionicLoading','$timeout','ActivityService','AgendaService','I18nService','$stateParams','_','$location','$filter','$timeout','$q','$rootScope',function($scope, $ionicPopup,$ionicListDelegate,$ionicLoading, $timeout,ActivityService,AgendaService,I18nService,$stateParams,_,$location,$filter,$timeout,$q,$rootScope) {

        $scope.title = "Activitats"; 
        $scope.fullEvents = false;
        $scope.eventsList = [];
        $scope.agendaList = [];
        var changeEvents = {};

        $scope.$on('$ionicView.enter', function() {
            //Load the new items
            if ($scope.messagesInitialized && $scope.agendaInitialized && $location.$$url === '/app/agendaevents'){
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

            $q.all ([ActivityService.getActivityItems(),AgendaService.getAgendaItems()]).then(function (results){

                $scope.eventsList = results[0]; 
                $scope.agendaList= results[1]; 

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


        $scope.initAgendaEvent = function (){
            $scope.initList().then (function (){
                $scope.currentEvent = _.findWhere($scope.agendaList,{_id: $stateParams.agendaEventId});
            });

        };


        $scope.initActivityEvent = function (){
            $scope.initList().then (function (){
                $scope.currentActivity = _.findWhere($scope.eventsList,{_id: $stateParams.activityEventId});
            });

        };

        $scope.refreshItems = function (){

            if ($rootScope.routeToServicesNotAvailable){
                $scope.$broadcast('scroll.refreshComplete'); 
            }else{
                $q.all ([ActivityService.retrieveNewItems(),AgendaService.retrieveNewItems()]).then(function (results){
                    $scope.eventsList = results[0]; 
                    $scope.agendaList= results[1]; 

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

        
        $scope.openExternalURL = function(url){
            navigator.app.loadUrl(url, {openExternal: true});
        };

        $scope.initializeBundles = function(){

            return $q.all ([I18nService.isReady(),I18nService.getResourceBundles('agendaEvents')]).then(function (data) {
                var resourceBundle =  data[1];
                $scope.rb = resourceBundle;

                //Initialize this 
                $scope.pullText = resourceBundle['ag_list_pull'];
            }); 
        };


    }]);


