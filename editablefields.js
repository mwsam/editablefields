// $Id$

Drupal.behaviors.editablefields = function(context) {
  $('div.editablefields', context).not('.clicktoedit').not('.editablefields-processed').each(function() {
     $(this).addClass('.editablefields-processed');
     Drupal.editablefields.load(this);
  });
  $('div.editablefields', context).filter('.clicktoedit').not('.editablefields-processed').each(function() {
     $(this).prepend(Drupal.settings.editablefields.clicktoedit_message);
     $(this).click(Drupal.editablefields.init);
  });
  $('div.editablefields',context).not(',editablefields-processed').submit(function(){
     return false;
  });
}
  

Drupal.editablefields = {};

Drupal.editablefields.init = function() {
  $(this).unbind("click",Drupal.editablefields.init);
  $(this).addClass('.editablefields-processed');
  $(this).children().hide();
  Drupal.editablefields.load(this);
}
  
Drupal.editablefields.load = function(element) {
  newDiv = document.createElement("div");
  $(newDiv).addClass('editablefields_throbber');
  $(newDiv).width($(element).width());
  $(newDiv).height($(element).height());
  $(element).prepend($(newDiv));
  
  var url = Drupal.settings.editablefields.url_html + "/" + $(element).attr("nid") + "/" + $(element).attr("field")+ "/" + $(element).attr("delta");
  $.ajax({
    url: url,
    type: 'GET',
    success: function(response) {
      // Call all callbacks.
      if (response.__callbacks) {
        $.each(response.__callbacks, function(i, callback) {
          eval(callback)(element, response);
        });
      }
      $(element).html(response.content);
      Drupal.attachBehaviors(element);
      $(element).find(':input').change(function() {
        Drupal.editablefields.onchange(this);
      });
    },
    error: function(response) {
      alert(Drupal.t("An error occurred at ") + url);
    },
    dataType: 'json'
  });
};

Drupal.editablefields.onchange = function(element) {
  if (!$(element).hasClass('editablefields')) {
    element = $(element).parents('div.editablefields');
  }

  // Provide some feedback to the user while the form if being processed.
//  $(element).children().css('opacity', '0.5');

  newDiv = document.createElement("div");
  $(newDiv).addClass('editablefields_throbber');
  $(newDiv).width($(element).width());
  $(newDiv).height($(element).height());
  $(element).before($(newDiv));
  $(element).addClass('editablefields_greyed');
  
  // Send the field form.
  $.ajax({
     type: "POST",
     url: Drupal.settings.editablefields.url_submit, 
     data: $(element).find('form').serialize() + "&nid=" + $(element).attr("nid") + "&field=" + $(element).attr("field")+ "&delta=" + $(element).attr("delta"),
     element: $(element),
     success: function(msg) {
        Drupal.editablefields.load(element);
     },
     error: function(msg) {
        alert(Drupal.t("Error, unable to make update:") +" "+ msg.responseText);
     }
    });
  
  // Ensure same changes are not submitted more than once.
  $(element).find(':input').each(function() {
    $(this).attr("disabled", true);
  });

  // Do not actually submit.
  return false;
};
