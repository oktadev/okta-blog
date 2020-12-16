/**
 * jQuery version downgraded to 2.x for compatibility with swiftype library ($.ajax.success dependency)
 */

//= require vendor/jquery-2.2.4.min
//= require vendor/jquery.ba-hashchange.min
//= require vendor/jquery.swiftype.autocomplete
//= require vendor/jquery.swiftype.search


(function ($) {
    class Navigation {

        constructor(container = '.navigation') {
            this.expanded = false
            this.searchExpanded = false
            this.$container = $(container)
            this.$subMenus = this.$container.find('.sub-menu')
            this.$hamburguer = this.$container.find('.hamburger')
            this.$mobileMenu = this.$container.find('.mobile-menu')
            this.$coveoSearchBox = this.$container.find('.SearchBox')
            this.$searchToggle = this.$container.find('.search-toggle')
            this.$coveoSearchButton = this.$container.find('.CoveoSearchButton')
            this.$menuHasChildren = this.$mobileMenu.find('.menu-item.has-children')
            this.$mobileSearchContainer = this.$container.find('.mobile-search-container')
            this.$mobileSearch = this.$mobileSearchContainer.find('.search-box input')
        }

        init() {
            this.bindSearchEvents()
            this.bindSubMenuEvents()
            this.bindHamburgerEvents()
        }

        bindHamburgerEvents() {
            this.$hamburguer.click(() => {
                if (this.expanded) {
                    this.contractMenu()
                    return
                }
                this.expandMenu()
            })
        }

        bindSearchEvents() {
            this.$searchToggle.click(() => {
                if (this.searchExpanded) {
                    this.contractSearch()
                    return
                }
                this.expandSearch()
            })
        }

        bindSubMenuEvents() {
            this.$menuHasChildren.click(this.toggleSubMenu)
        }

        triggerSearch(ev) {
            let key = ev.which
            if (key === 13) {
                this.$coveoSearchButton.trigger('click')
                return false
            }
        }

        expandMenu() {
            this.expanded = true
            this.contractSearch()
            this.$mobileMenu.addClass('open')
            this.$hamburguer.addClass('active')
        }

        contractMenu() {
            this.expanded = false
            this.$subMenus.removeClass('open')
            this.$mobileMenu.removeClass('open')
            this.$hamburguer.removeClass('active')
        }

        expandSearch() {
            this.contractMenu()
            this.searchExpanded = true
            this.$mobileSearchContainer.addClass('open')
        }

        contractSearch() {
            this.searchExpanded = false
            this.$mobileSearchContainer.removeClass('open')
        }

        toggleSubMenu(ev) {
            $(ev.currentTarget).toggleClass('open')
        }
    }


    const $nav = $('.navigation')

    if ($nav.length) {
        const navigation = new Navigation('.navigation')
        navigation.init()
    }

})(jQuery)
