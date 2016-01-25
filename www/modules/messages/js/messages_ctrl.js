angular.module('starter.messages').controller('MessagesCtrl',['$scope','$ionicPopup','$ionicListDelegate','$ionicLoading','AuthService','MessagesService','I18nService','$stateParams','_','$location','$filter','$timeout','$q','$rootScope',function($scope, $ionicPopup,$ionicListDelegate,$ionicLoading, AuthService,MessagesService,I18nService,$stateParams,_,$location,$filter,$timeout,$q,$rootScope) {
    
    
    var LOADING_TMPLT= '<i class="ion-loading-c"></i> ';
    $scope.currentMessage = {};
    $scope.popover = {};
    $scope.undoAnimated = '';
    $scope.commonSolution = '';
    
    $scope.pullText = 'pull';
    $scope.showElements = 10;
    
    if (localStorage.newMessages===undefined){
        localStorage.newMessages=0;
    }
    
    $scope.$on('$ionicView.enter', function() {

        //Load the new messages
        if ($scope.messagesInitialized && $location.$$url === '/app/messages'){
            $scope.refreshMessages();
        }
    });
    
    $scope.$on('$ionicView.leave', function() {

        //Load the new messages
        if ($scope.messagesInitialized && $location.$$url !== '/app/messages'){
            $rootScope.newMessages=0;
            localStorage.newMessages=0;
        }
    });


    $scope.initList = function () {
        //Clear any undo action
        var initialized = $q.defer();
        
        $scope.undoMessage = MessagesService.undoMessage;
        $scope.initializeBundles().then (function () {
            $ionicLoading.show({template: LOADING_TMPLT +  $scope.rb.ctrl_message_initializing + "..."});
            
            MessagesService.getMessages().then(function (messages){
                $scope.messagesList= messages;//Is the second promise return parameter
                initialized.resolve();
                $scope.messagesInitialized = true;
                $scope.refreshMessages();
            }).catch (function (error){
                $scope.showAlert (rb.ctrl_while_stor, $scope.commonSolution);
                initialized.reject (); //Not necessary to show an specific code
            }).finally (function (){
                $ionicLoading.hide();  
            });
        });
        
        return initialized.promise;
    };
                                            
    $scope.initMessage = function (){
        //Clear any undo action
        $scope.undoMessage = MessagesService.undoMessage;
        MessagesService.setToUndo();
        
        $q.all([$scope.initializeBundles(),MessagesService.getMessages()]).then (function (data){
            var messages = data[1];
            $scope.messagesList= messages;
            $scope.currentMessage = _.findWhere(messages,{id:$stateParams.messageId});
            MessagesService.changeState($scope.currentMessage.id,'read').catch (function () {
                $scope.showAlert ($scope.rb.ctrl_while_changing, $scope.commonSolution);
            });
        });
    };
    
    $scope.emptyList = function (){
        return ($scope.messagesList === undefined || $scope.messagesList.length === 0);
    };
    
    $scope.showMoreElements = function (){
        $scope.showElements+=20;
        $scope.$broadcast('scroll.infiniteScrollComplete');
    };
    
    $scope.hasMoreElements = function (){
        return $scope.messagesList ? ($scope.showElements < $scope.messagesList.length) : false;
    }
    
    $scope.deleteMessage = function (message){

        //We activate it to apply the animations now
       $scope.undoAnimated = 'animated';

        $ionicListDelegate.closeOptionButtons();
        message.hide = true;
        MessagesService.setToUndo(message);

        $timeout(function (){
            //We look the message again because the position maybe changed for a previous delete
            var deleteMessage = message;
            
            if (deleteMessage && deleteMessage.hide) {
                //if the undo message is the current deleted message then we hide the undo button
                if ($scope.undoMessage.currentMessage && 
                    $scope.undoMessage.currentMessage.id === deleteMessage.id){
                    MessagesService.setToUndo();
                }
                MessagesService.delete(deleteMessage.id).catch (function (error){
                     $scope.showAlert ($scope.rb.ctrl_while_deleting, $scope.commonSolution);  
                });
            }
        }, 5000);
    };
    
    $scope.markAs = function (message,state){
       
        //Save the new state
        MessagesService.changeState(message.id,state).catch (function () {
                $scope.showAlert ($scope.rb.ctrl_while_changing, $scope.commonSolution);
        });
        
        $ionicListDelegate.closeOptionButtons();
        
    };
    
     $scope.openOptions = function (message){
         //Clear any undo action
        MessagesService.setToUndo();
        
         var changeButton = (message.state==='read') ? {
                 text: '<i class="ion-eye-disabled"></i> <b>' + $scope.rb.ms_action_markunread + '</b>',
                 type: 'button-energized',
                 onTap: function(e) {
                     $scope.markAs(message,'unread');
                 }
            } : 
            {
                 text: '<i class="ion-eye"></i> <b>'+ $scope.rb.ms_action_markread + '</b>',
                 type: 'button-balanced',
                 onTap: function(e) {
                     $scope.markAs(message,'read');
                 }
            };
        
        var buttons =  [
                {text: '<i class="ion-trash-b"></i> <b>'+ $scope.rb.ms_action_delete + '</b>',
                 type: 'button-assertive',
                 onTap: function(e) {
                     $scope.deleteMessage(message);
                    }
                },
                 changeButton,
                 {text: 'Cancel' }
        ];
         
        $scope.optionsPopup = $ionicPopup.show({
            title: '<h3>'+ $scope.rb.ms_list_whattodo + '</h3>',
            scope: $scope,
            cssClass: 'udlapp-options-menu',
            buttons: buttons,
            animation: 'slide-in-up'
        });
    };
    
    $scope.closeOptions = function ($index){
        $scope.popover.hide();   
    };
    
    $scope.buttonClassNumber = function (sitename){
        var number = 0;
        
        if (sitename && sitename.length > 3){
            number =  (sitename.charCodeAt(0) + sitename.charCodeAt(1)  + sitename.charCodeAt(2)) % 10;
        }
        
        return 'btn_' + number;
    };
    
    $scope.byPrettyDate = function(arr) {
        return $filter('min')
        ($filter('map')(arr, 'prettyDateOrder'));
    } ;
    
    
    $scope.applyUndo = function (){
        if ($scope.undoMessage.currentMessage){
            delete $scope.undoMessage.currentMessage.hide;
            
            //Clear any undo action
            MessagesService.setToUndo();
        }
    };
    
    $scope.refreshMessages = function (){
        
        if ($rootScope.routeToServicesNotAvailable){
            $rootScope.authenticate().then (function (){
                $scope.refreshMessages();    
            }).finally (function (){
                $scope.$broadcast('scroll.refreshComplete');
                recalculateDates ();
            });
        }else{
            MessagesService.retrieveNewMessages().then (function (numMessages){
                $rootScope.newMessages = parseInt(localStorage.newMessages,10) + numMessages;
                localStorage.newMessages = $rootScope.newMessages;
                
            }).catch (function (error){
                if (error !== MessagesService.errorCodes.ALREADY_RETRIEVING){
                    $scope.showRefreshListError();
                    $rootScope.routeToServicesNotAvailable = true;
                }
            }).finally(function (){
                $scope.$broadcast('scroll.refreshComplete'); 
                recalculateDates();
            });
        }
    };
    
    $scope.showAlert = function (action,todo){
        $ionicPopup.alert ({
            title: '<i class="ion-alert"></i> ' + $scope.rb.ctrl_problem_ocurred,
            template:  $scope.rb.compose('ctrl_problem_desc',action,todo)
        });
    };   
    
    $scope.showRefreshListError = function (){
        $scope.showAlert ($scope.rb.ctrl_while_refreshing,$scope.rb.ctrl_refreshlater); 
    };
    
    $scope.openExternalURL = function(url){
//            navigator.app.loadUrl(url, { openExternal: true });
            window.open(url, '_system');
    };
    
   $scope.initializeBundles = function(){
       
       return $q.all ([I18nService.isReady(),I18nService.getResourceBundles('messages')]).then(function (data) {
            var resourceBundle =  data[1];
            $scope.rb = resourceBundle;
               
           //Initialize this 
           $scope.pullText = resourceBundle['ms_list_pull'];
           $scope.commonSolution = resourceBundle['ctrl_common_sol'];

       }); 
   };
    
    var recalculateDates = function (){
        //Recalculate pretty Dates
        var now = new Date()

        if (!localStorage.lastViewAccess){
            localStorage.lastViewAccess = now;
        }

        var lastViewAccess = localStorage.lastViewAccess;

        if (!moment(lastViewAccess).isSame(now,'day')){
            localStorage.lastViewAccess = now;
            MessagesService.recalculateDates();
        }

    };
  
}]).filter('hrefToJS', function ($sce, $sanitize) {
    return function (text) {
        var regex = /href="([\S]+)"/g;
        var newString = $sanitize(text).replace(regex, "onclick=\"angular.element(this).scope().openExternalURL('$1');return false\" href=");
        return $sce.trustAsHtml(newString);
    }
});
