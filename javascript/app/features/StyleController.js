import $ from 'jquery'
import _ from 'lodash'
import StyleView from './StyleView'
import StyleModel from './StyleModel'
import StylePreviewController from './StylePreviewController'
import styles from '../../lib/styles'
import {setAction} from '../Utils'

export default function StyleController(store) {
  const view = StyleView()
  const allFields = getAllFields()
  const styleModel = StyleModel(view, allFields)

  const stylePreview = StylePreviewController(store)

  store.subscribe(stylePreview.previewSpaceHandler)
  // styleModel.change(stylePreview.previewSpaceHandler)
  styleModel.fields.change()

  _.forEach(allFields, function(field) {
    view.$styleForm.find(":input[id='" + field + "']").change(styleEditorHandler)
  })

  var pdfStyleSelectorCurrent
  view.$styleSelector.change(styleHandler).val('body').change()

  return {
    $element: view.$element.add(stylePreview.$element)
  }

  function getAllFields() {
    return _(styles.styles).map(function(pv, e) {
      return _.map(pv, function(v, p) {
        return p
      })
    }).flatten().uniq().value()
  }

  /**
   * Change which style to edit
   * @param event UI change event
   */
  function styleHandler(event) {
    var target = $(event.target)
    var style = target.val()
    view.$styleForm.find('[data-style]').each(function() {
      var f = $(this)
      f.toggle($(this).attr('data-style').split(" ").indexOf(style) !== -1)
    })
    var type = target.find(":selected").parent("optgroup.block")
    const $blocks = view.$styleForm.find(".style-selector-block")
    if(type.length === 0) {
      view.$styleForm.find(".style-selector-block").hide().find(":input").attr('disabled', true)
    } else {
      view.$styleForm.find(".style-selector-block").show().find(":input").removeAttr('disabled')
    }
    pdfStyleSelectorCurrent = target.val()
    styleModel.readFromModel(target.val())
  }

  function getValue(element, property, value) {
    if (!(styles.styles[element] && styles.styles[element][property])) {
      return value
    }
    switch (typeof styles.styles[element][property].default) {
      case 'boolean':
        return (value === 'true')
      case 'number':
        return Number(value)
      default:
        return value
    }
  }

  /**
   * Update store when UI changes
   * @param event UI change event
   */
  function styleEditorHandler(event) {
    const input = $(event.target)
    const field = input.attr('id')
    const def = styles.styles[pdfStyleSelectorCurrent][field]

    const currentStyle = store.getState().configuration.style
    const oldValue = currentStyle[pdfStyleSelectorCurrent][field]
    var newValue
    if(input.is(":checkbox")) {
      if(input.is(":checked")) {
        newValue = input.val()
      } else if(field === 'text-decoration') {
        newValue = 'none'
      } else {
        newValue = 'normal'
      }
    } else if(input.is(".editable-list")) {
      newValue = input.val()
    } else {
      newValue = input.val()
    }
    newValue = getValue(pdfStyleSelectorCurrent, field, newValue)

    const action = {
      configuration: {
        style: {}
      }
    }
    action.configuration.style[pdfStyleSelectorCurrent] = {}
    action.configuration.style[pdfStyleSelectorCurrent][field] = newValue
    _.forEach(styles.styles, (elementValue, element) => {
      const def = elementValue[field]
      if(!!def && def.inherit === pdfStyleSelectorCurrent && currentStyle[element][field] === oldValue) {
        action.configuration.style[element] = {}
        action.configuration.style[element][field] = newValue
      }
    })
    store.dispatch(setAction(action))

    styleModel.writeFieldToModel(field, pdfStyleSelectorCurrent)
  }

}
