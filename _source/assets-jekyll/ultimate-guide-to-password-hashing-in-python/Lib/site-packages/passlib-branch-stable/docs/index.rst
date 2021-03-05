.. image:: _static/masthead.png
   :align: center
   :class: show-for-small


.. rst-class:: float-right

.. seealso:: :ref:`What's new in Passlib 1.7.4 <whats-new>`

==========================================
Passlib |release| documentation
==========================================

.. only:: devcopy

   .. warning::

        This is the documentation for a development version of Passlib.
        For documentation of the latest stable version,
        see `<https://passlib.readthedocs.io>`_.

.. rst-class:: without-title

.. note::

  **2020-05-01: Passlib's public repository has moved to Heptapod!**

  Due to BitBucket deprecating Mercurial support, Passlib's public repository and issue tracker
  has been relocated.  It's now located at `<https://foss.heptapod.net/python-libs/passlib>`_,
  and is powered by `Heptapod <https://heptapod.net/>`_.
  Hosting is being graciously provided by the people at
  `Octobus <https://octobus.net/>`_ and `CleverCloud <https://clever-cloud.com/>`_!

Welcome
=======
Passlib is a password hashing library for Python 2 & 3, which provides
cross-platform implementations of over 30 password hashing algorithms, as well
as a framework for managing existing password hashes. It's designed to be useful
for a wide range of tasks, from verifying a hash found in /etc/shadow, to
providing full-strength password hashing for multi-user application.

As a quick sample, the following code hashes and then verifies a password
using the :doc:`PBKDF2-SHA256 </lib/passlib.hash.pbkdf2_digest>` algorithm::

    >>> # import the hash algorithm
    >>> from passlib.hash import pbkdf2_sha256

    >>> # generate new salt, and hash a password
    >>> hash = pbkdf2_sha256.hash("toomanysecrets")
    >>> hash
    '$pbkdf2-sha256$29000$N2YMIWQsBWBMae09x1jrPQ$1t8iyB2A.WF/Z5JZv.lfCIhXXN33N23OSgQYThBYRfk'

    >>> # verifying the password
    >>> pbkdf2_sha256.verify("toomanysecrets", hash)
    True
    >>> pbkdf2_sha256.verify("joshua", hash)
    False

.. rst-class:: toc-always-open

Getting Started
===============

This documentation is organized into two main parts:
a narrative walkthrough of Passlib, and a top-down API reference.

:doc:`install`

    See this page for system requirements & installation instructions.

:doc:`narr/index`

    New users in particular will want to visit the walkthrough, as it provides
    introductory documentation including installation requirements,
    an overview of what passlib provides, and a guide for getting started quickly.

:doc:`lib/index`

    The API reference contains a top-down reference of the :mod:`!passlib` package.

:doc:`other`

    This section contains additional things that don't
    fit anywhere else, including an :doc:`FAQ <faq>` and a complete
    :doc:`changelog <history/index>`.

Online Resources
================

    .. table::
        :class: fullwidth
        :column-alignment: lr

        =================== ===================================================
        Latest Docs:        `<https://passlib.readthedocs.io>`_
        Latest News:        `<https://foss.heptapod.net/python-libs/passlib/wikis/home>`_
        Public Repo:        `<https://foss.heptapod.net/python-libs/passlib>`_
        Mailing List:       `<https://groups.google.com/group/passlib-users>`_
        Downloads @ PyPI:   `<https://pypi.python.org/pypi/passlib>`_
        =================== ===================================================

Hosting
=======

Thanks to the people at `Octobus <https://octobus.net/>`_ and `CleverCloud <https://clever-cloud.com/>`_
for providing the repository / issue tracker hosting, as well as development of `Heptapod <https://heptapod.net/>`_!

Thanks to `ReadTheDocs <https://readthedocs.io>`_ for providing documentation hosting!
