document.addEventListener('DOMContentLoaded', function () {
	var modalStack = document.createElement('div');
	modalStack.classList.add('modal-stack');
	
	function focusModal(modal) {
		if (!modal)
			return false;
		var focus = modal.querySelector('[autofocus]');
		if (!focus) {
			var els = modal.querySelectorAll('input,textarea,select,button,[contenteditable]');
			var el;
			for (var i = 0; i < els.length; i++) {
				el = els[i];
				if (!el.disabled && !el.readOnly) {
					focus = el;
					break;
				}
			}
		}
		setTimeout(function () {
			(focus || modal).focus();
		}, 0);
	}
	
	var Modal = window.Modal = {
		show: function (content) {
			if (!modalStack.parentElement) {
				document.body.appendChild(modalStack);
			}
			if (!(content instanceof HTMLElement)) {
				var container = document.createElement('div');
				container.textContent = content;
				content = container;
			}
			
			modalStack.appendChild(content);
			document.body.classList.toggle('modal-stack-show', modalStack.children.length > 0);
			content.dispatchEvent(new CustomEvent('modal-show', {
				detail: {
					modalStack: modalStack,
				},
				bubbles: true,
				target: content,
			}));
			focusModal(content);
			return content;
		},
		hide: function () {
			var hideContent = this.get();
			if (hideContent) {
				hideContent.dispatchEvent(new CustomEvent('modal-hide', {
					detail: {
						modalStack: modalStack,
					},
					bubbles: true,
					target: hideContent,
				}));
				modalStack.removeChild(hideContent);
			}
			document.body.classList.toggle('modal-stack-show', modalStack.children.length > 0);
			return hideContent;
		},
		prompt: function (content) {
			var form = content.matches('form') ? content : content.querySelector('form');
			var _this = this;
			return new Promise(function (resolve, reject) {
				try {
					if (!form) {
						throw new Error("Unable to prompt: there are no form elements within modal node");
					}
					
					function onModalHide() {
						content.removeEventListener('modal-hide', onModalHide);
						form.removeEventListener('submit', onFormSubmit);
						resolve && resolve(null);
						resolve = reject = null;
					}
					
					function onFormSubmit(event) {
						var modals = [];
						for (var i = modalStack.children.length - 1; i >= 0; i--) {
							modals.push(modalStack.children[i]);
							if (modalStack.children[i] === content) {
								break;
							}
						}
						event.preventDefault();
						var result = new FormData(form);
						resolve && resolve(result);
						resolve = reject = null;
						if (modals[modals.length - 1] !== content) {
							throw new Error("Unable to find current modal in modal stack");
						}
						modals.forEach(function () {
							_this.hide();
						});
					}
					
					content.addEventListener('modal-hide', onModalHide);
					form.addEventListener('submit', onFormSubmit);
					_this.show(content);
				}
				catch (err) {
					if (reject) {
						reject(err);
					}
					else {
						resolve = reject = null;
						console.error(err);
					}
				}
			});
		},
		get: function () {
			return modalStack.children.length ? modalStack.children[modalStack.children.length - 1] : null;
		},
	};
	
	function closingTriggerListener(event) {
		if (event.type === 'mousedown') {
			closingTriggerListener.clicking = event.target === modalStack;
		}
		else if (event.type === 'mouseup' && event.target !== modalStack) {
			closingTriggerListener.clicking = false;
		}
		else if (event.type === 'keydown') {
			closingTriggerListener.__downKeyCode = event.keyCode;
		}
		else if (event.type === 'mouseup' && closingTriggerListener.clicking) {
			Modal.hide();
			focusModal(Modal.get());
		}
		else if (event.type === 'keyup') {
			if (event.keyCode === 27 && closingTriggerListener.__downKeyCode === event.keyCode) {
				Modal.hide();
				focusModal(Modal.get());
			}
			closingTriggerListener.__downKeyCode = null;
		}
	}
	modalStack.addEventListener('mousedown', closingTriggerListener);
	document.body.addEventListener('mouseup', closingTriggerListener);
	document.body.addEventListener('keydown', closingTriggerListener);
	document.body.addEventListener('keyup', closingTriggerListener);
});
