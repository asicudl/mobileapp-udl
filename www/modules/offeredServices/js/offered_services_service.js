angular.module('starter.offeredservices', [])
.service('OfferedServicesService',[function (){
 
    this.getAOfferedServices = function (){
        var items = [{ title: 'Serveis informàtics', id: '2', description:'L\'estudiantat pot tenir suport infomàtic adreçant-se als punts d\'atenció en cada campus, a través del telèfon o bé ' },
                { title: 'Servei d\'atenció a l\'estudiantat', id: '3', description:'Aquest servei pot rebre peticions dels usuaris qui formalitzaran les seves peticions en el bé de que es una petició contrastada i ...' }];
        return items;
    };
}]);