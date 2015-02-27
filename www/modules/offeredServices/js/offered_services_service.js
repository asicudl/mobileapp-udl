angular.module('starter.offeredservices', [])
.service('OfferedServicesService',[function (){
 
    this.getAOfferedServices = function (){
        var items = [{ title: 'La UdL lider en recerca biomèdica', id: '2', description:'qweip' },
                { title: 'Acte d\'entrega de premis al millor', id: '3', description:'qweip' },
                { title: 'Una noticia molt important', id: '4', description:'qweip'},
                { title: 'totes les coses van com a sempre', id: '5', description:'qweip' },
                { title: 'Les altres noticies també en portada', id: '6', description:'qweip' }];
        return items;
    };
}]);