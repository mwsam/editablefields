// $Id$

Drupal.behaviors.editablefields = function(context) {
  
  $('div.editablefields',context).not('.noonload').each(function() {
    $(this).children().css('opacity', '0.3');
    editablefieldsload(this, Drupal.settings.basePath+"?q=/editablefields_html/" + $(this).attr("nid") + "/" + $(this).attr("field"));
  });
  $('div.editablefields',context).change(editablefieldschanger);
  $('div.editablefields',context).submit(editablefieldschanger);


  var updateValue;
  
  function editablefieldsupdater(element) {
    var nid=$(element).attr("nid");
    $(element).children().css('opacity', '0.3');
    $.ajax({
    type: "POST",
          url: "?q=/editablefields_submit",
          data: $(element).find('form').serialize()+"&nid="+nid,
          element: $(element),
          success: function(msg) {
          updateValue = 0;
          editablefieldsload($(this.element), Drupal.settings.basePath+"?q=/editablefields_html/" + $(this.element).attr("nid") + "/" + $(this.element).attr("field"));
        },
          error: function(msg) {
          alert( "Error, unable to make update: " + msg.responseText);
        }
      });
  };
  
  function editablefieldsload(e, url) {
    $(e).ajaxSubmit({
    url: url,
          type: 'GET',
          success: function(response) {
          // Call all callbacks.
          if (response.__callbacks) {
            $.each(response.__callbacks, function(i, callback) {
                     eval(callback)(e, response);
                   });
          }
          $(e).html(response.content);
          Drupal.attachBehaviors(e);
          $(e).find(':input').change(editablefieldschanger);
          $(e).find(':input').submit(editablefieldschanger);
        },
          error: function(response) {
          alert(Drupal.t("An error occurred at ") + url);
        },
          dataType: 'json'
          });
  }
  
  function editablefieldschanger() {
    var t=this;
    
    if (!$(this).hasClass('editablefields')) {
      t = $(this).parents('div.editablefields');
    }
    
    newValue = $(t).find('form').serialize();
// all this does is prevent you from submitting the same data twice... If in the
// meantime the user hits a different button, then, I guess the user knows what
// they want.
    if (newValue != updateValue) {
      updateValue = newValue;
      editablefieldsupdater($(t));
    }
    return false; // dont actually submit
  };
};

