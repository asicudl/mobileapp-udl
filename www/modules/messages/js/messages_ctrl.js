angular.module('starter.messages').controller('MessagesCtrl',['$scope','$ionicPopup','$ionicListDelegate','$timeout','AuthService','MessagesService','I18nService','$stateParams','_','$location','$filter','$timeout','$q',function($scope, $ionicPopup,$ionicListDelegate, $timeout,AuthService,MessagesService,I18nService,$stateParams,_,$location,$filter,$timeout,$q) {

    $scope.currentMessage = {};
    $scope.popover = {};
    $scope.undoAnimated = '';
    $scope.commonSolution = '';
    
    $scope.pullText = 'pull';
    
    $scope.$on('$ionicView.enter', function() {
        //Load the new messages
        $scope.refreshMessages();
    });

    $scope.initList = function (){
        //Clear any undo action
        var initialized = $q.defer();
        
        $scope.undoMessage = MessagesService.undoMessage;
        
        MessagesService.getMessages().then(function (messagesList){
            $scope.messagesList= messagesList;
            initialized.resolve();
            
        }).catch (function (error){
            $scope.showAlert (rb.ctrl_while_stor, $scope.commonSolution);
            initialize.reject (); //Not necessary to show an specific code
        });
        
        
        
        return initialized.promise;
    };
                                            
    $scope.initMessage = function (){
        //Clear any undo action
        MessagesService.setToUndo();
        
        $scope.initList().then (function (){
            $scope.currentMessage = _.findWhere($scope.messagesList,{id:$stateParams.messageId});
            MessagesService.changeState($scope.currentMessage.id,'read').catch (function () {
                $scope.showAlert ($scope.rb.ctrl_while_changing, $scope.commonSolution);
            });
        });
        
    };
    
    $scope.emptyList = function (){
        return ($scope.messagesList === undefined || $scope.messagesList.length === 0);
    };
    
    $scope.deleteMessage = function (index){
        
        if (typeof index ==='string'){ // Is an string call the main view to delete it
            var index = _.findIndex($scope.messagesList,{id: index});
        }

        //We activate it to apply the animations now
       $scope.undoAnimated = 'animated';
        
        var messageId = $scope.messagesList[index].id;

        $ionicListDelegate.closeOptionButtons();
        $scope.messagesList[index].hide = true;
        MessagesService.setToUndo($scope.messagesList[index]);

        $timeout(function (){
            //We look the message again because the position maybe changed for a previous delete
            var deleteMessage = _.findWhere ($scope.messagesList,{id: messageId});
            
            if (deleteMessage && deleteMessage.hide) {
                //if the undo message is the current deleted message then we hide the undo button
                if ($scope.undoMessage.currentMessage && 
                    $scope.undoMessage.currentMessage.id === deleteMessage.id){
                    MessagesService.setToUndo();
                }
                MessagesService.delete(messageId).catch (function (error){
                     $scope.showAlert ($scope.rb.ctrl_while_deleting, $scope.commonSolution);  
                });
            }
            
        }, 5000);
    };
    
    $scope.markAs = function (index,state){
       
       if (typeof index ==='string'){ // Is an string call the main view to delete it
            var index = _.findIndex($scope.messagesList,{id: index});
        }
        
        var messageId = $scope.messagesList[index].id;
        $scope.messagesList[index].state = state;

        //Save the new state
        MessagesService.changeState(messageId,state).catch (function () {
                $scope.showAlert ($scope.rb.ctrl_while_changing, $scope.commonSolution);
        });
        
        $ionicListDelegate.closeOptionButtons();
        
    };
    
     $scope.openOptions = function (index){
         //Clear any undo action
        MessagesService.setToUndo();
        
         var changeButton = ($scope.messagesList[index].state==='read') ? {
                 text: '<i class="ion-eye-disabled"></i> <b>' + $scope.rb.ms_action_markunread + '</b>',
                 type: 'button-energized',
                 onTap: function(e) {
                     $scope.markAs(index,'unread');
                 }
            } : 
            {
                 text: '<i class="ion-eye"></i> <b>'+ $scope.rb.ms_action_markread + '</b>',
                 type: 'button-balanced',
                 onTap: function(e) {
                     $scope.markAs(index,'read');
                 }
            };
        
        var buttons =  [
                {text: '<i class="ion-trash-b"></i> <b>'+ $scope.rb.ms_action_markdelete + '</b>',
                 type: 'button-assertive',
                 onTap: function(e) {
                     $scope.deleteMessage(index);
                    }
                },
                 changeButton,
                 {text: 'Cancel' }
        ];
         
        $scope.optionsPopup = $ionicPopup.show({
            title: '<h3>'+ scope.rb.ms_list_whattodo + '</h3>',
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
    
    $scope.refreshMessages = function (isRetry){
        MessagesService.retrieveNewMessages().then (function (numMessages){
            $scope.newMessages = numMessages;
        }).catch (function (error){
            //Lets guess if it's a authentication problem or a connection problem
            AuthService.isTokenAuth().catch (function (error){
                if (error === AuthService.errorCodes.TOKEN_VALIDATION_FAILED && !isRetry) {
                        //In case that api token validation is not still valid try it again
                        AuthService.authenticateByToken().then (function (){
                            $scope.refreshMessages(true);
                        }).catch (function (error){
                            if (error === AuthService.errorCodes.NO_VALID_TOKEN || error === AuthService.errorCodes.NO_TOKEN_DATA){
                                //Call login automatically ¿?¿?            
                            }else{
                                $scope.showRefreshListError();
                            }
                        });

                 }else{
                         $scope.showRefreshListError();
                 }
            }); 
        }).finally(function (){
            $scope.$broadcast('scroll.refreshComplete'); 
        });
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
        navigator.app.loadUrl(url, {openExternal: true});
    };
    
    $q.all([I18nService.isReady()]).then(function (){
    
        I18nService.getResourceBundles('messages').then(function (resourceBundle) {
            $scope.rb = resourceBundle;
            
            //Initialize this 
            $scope.pullText = resourceBundle['ms_list_pull'];
            $scope.commonSolution = resourceBundle['ctrl_common_sol'];
        }); 
    });
    
}]);
