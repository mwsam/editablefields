
editablefields = function() {
  $('div.editablefields').not('.noonload').each(function() {
                                                $(this).children().css( 'opacity', '0.3' ); 
                                                editablefieldsload(this,"?q=/editablefields_html/"+$(this).attr("nid")+"/"+$(this).attr("field"));
                                              });


  $('div.editablefields').change(editablefieldschanger);
  $('div.editablefields').submit(editablefieldschanger);
};
  
var updateValue;

editablefieldsupdater = function(element) 
{
  var nid=$(element).attr("nid");
  $(element).children().css( 'opacity', '0.3' ); 
  
  $.ajax({
  type: "POST",
        url: "?q=/editablefields_submit",
        data: $(element).find('form').serialize()+"&nid="+nid,
        element: $(element),
        success: function(msg){
            updateValue=0;
            editablefieldsload($(this.element),"?q=/editablefields_html/"+$(this.element).attr("nid")+"/"+$(this.element).attr("field"));
      },
        error: function(msg){
        alert( "Error, unable to make update: " + msg.responseText );
      }
    });
};

editablefieldsload = function( e, url) 
{
  $(e).ajaxSubmit({
            url: url,
            type: 'GET',
            success: function(response) {
              // Call all callbacks.
              if (response.__callbacks) {
                $.each(response.__callbacks, function(i, callback) {
                  eval(callback)(e, response);
//                         alert(response.scripts.inline);                         
                });
              }
              $(e).html(response.content);
              $(e).find(':input').change(editablefieldschanger);
              $(e).find(':input').submit(editablefieldschanger);
            },
            error: function(response) { alert(Drupal.t("An error occurred at ") + url ); },
            dataType: 'json'
          });
}
  
editablefieldschanger = function() 
{
  var t=this;
  
  if (! $(this).hasClass('editablefields') ) {
    t=$(this).parents('div.editablefields');
  }

  newValue=$(t).find('form').serialize();
  if (newValue!=updateValue) {
    updateValue=newValue;
    editablefieldsupdater($(t));
  }
  return false;// dont actually submit
};

if (Drupal.jsEnabled) {
  $(document).ready(editablefields);
}
