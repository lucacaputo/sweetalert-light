class Alert {
    static hider = null;
    state = {
        isConfirmed: false,
        isDenied: false,
        dismissMode: null,
    }

    static animate(element, time, exec) {
        exec();
        return new Promise((res, rej) => {
            if (!element) rej(new Error('element undefined'));
            setTimeout(() => res(element), time);
        })
    }

    static buildHider() {
        const hider = document.createElement('div');
        hider.className = "__alert_hider __alert_hider_hidden";
        document.body.appendChild(hider);
        return hider;
    }

    static init() {
        Alert.hider = Alert.buildHider();
    }

    generatePopup(options) {
        const popup = document.createElement('div');
        popup.className = "__alert_popup __alert_popup_hidden";
        const popupTitle = document.createElement('h2');
        popupTitle.className = "__alert_title";
        popupTitle.innerText = options.title;
        popup.appendChild(popupTitle);
        const middleCont = document.createElement('div');
        middleCont.className = "__popup_middle_container";
        if (options.hasOwnProperty('text')) {
            const p = document.createElement('p');
            p.className = "__popup_text";
            p.innerText = options.text;
            middleCont.appendChild(p);
        }
        popup.appendChild(middleCont);
        const bottomButtons = document.createElement('div');
        bottomButtons.className = "__alert_bottom_container";
        const confirmButton = document.createElement('button');
        confirmButton.type = "button";
        confirmButton.className = "__alert_button __alert_button_primary";
        confirmButton.innerText = options.confirmButtonText || 'Ok';
        confirmButton.addEventListener('click', () => {
            const confirmEvent = new Event('alert_confirm');
            this.state.dismissMode = "confirmButton";
            this.state.isConfirmed = true;
            this.state.isDenied = false;
            popup.dispatchEvent(confirmEvent);
        });
        bottomButtons.appendChild(confirmButton);
        if (options.hasOwnProperty('showDenyButton')) {
            const deny = document.createElement('button');
            deny.type = 'button';
            deny.className = "__alert_button __alert_button_danger";
            deny.innerText = options.denyButtonText || 'Cancella';
            deny.addEventListener('click', () => {
                const denyEvent = new Event('alert_deny');
                this.state.dismissMode = "denyButton";
                this.state.isConfirmed = false;
                this.state.isDenied = true;
                popup.dispatchEvent(denyEvent);
            });
            bottomButtons.appendChild(deny);
        }
        popup.addEventListener('click', e => e.stopPropagation());
        popup.appendChild(bottomButtons);
        return popup;
    }
    
    openPopup(popup) {
        return Alert.animate(popup, 15, () => {
            popup.classList.remove("__alert_popup_hidden");
            popup.classList.add("__alert_popup_visible");
        })
        .then(p => Alert.animate(p, 300, () => {
            p.classList.add("__alert_popup_fired");
        }))
    }

    closePopup(popup) {
        return Alert.animate(popup, 300, () => {
            popup.classList.remove("__alert_popup_fired");
        })
        .then(p => {
            return new Promise((res, rej) => {
                if (!p) rej(new Error('popup undefined'));
                p.classList.add("__alert_popup_hidden");
                popup.classList.remove("__alert_popup_visible");
                res(p);
            })
        })
    }

    static openHider() {
        return Alert.animate(Alert.hider, 15, () => {
            Alert.hider.classList.remove("__alert_hider_hidden");
            Alert.hider.classList.add("__alert_hider_visible");
        })
        .then(h => Alert.animate(h, 150, () => {
            h.classList.add("__alert_hider_fired");
        }))
    }

    static closeHider() {
        return Alert.animate(Alert.hider, 150, () => {
            Alert.hider.classList.remove("__alert_hider_fired");
        })
        .then(h => {
            return new Promise((res, rej) => {
                if (!h) rej(new Error('hider undefined'));
                h.classList.add("__alert_hider_hidden");
                h.classList.remove("__alert_hider_visible");
                res(h);
            })
        })
    }

    destroyPopup(popup) {
        popup.parentNode?.removeChild(popup);
    }

    dismissPopup(popup) {
        Alert.closeHider()
        .then(() => this.closePopup(popup))
        .then(p => this.destroyPopup(p));
    }

    static firePopup(options, evt=null) {
        evt && evt.stopPropagation();
        const alert = new Alert();
        const popup = alert.generatePopup(options);
        document.body.appendChild(popup);
        Alert.openHider()
        .then(() => alert.openPopup(popup));
        return new Promise((res, rej) => {
            document.body.addEventListener('click', () => {
                alert.state.dismissMode = "backdrop";
                alert.state.isConfirmed = false;
                alert.state.isDenied = true;
                const backdrop = new Event('backdrop_deny');
                popup.dispatchEvent(backdrop);
            });
            popup.addEventListener('alert_confirm', () => {
                alert.dismissPopup(popup);
                res(alert.state);
            });
            popup.addEventListener('alert_deny', () => {
                alert.dismissPopup(popup);
                res(alert.state);
            });
            popup.addEventListener('backdrop_deny', () => {
                alert.dismissPopup(popup);
                res(alert.state);
            });
            if (!popup) rej(new Error('popup undefined'));
        });
    }

}

document.addEventListener('DOMContentLoaded', Alert.init);